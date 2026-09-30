const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { ensureSkills } = require('../utils/helpers');
const { notify } = require('../services/notifications');

const include = {
  student: { select: { id: true, username: true, institutionId: true, user: { select: { name: true, avatarUrl: true } } } },
  skills: { include: { skill: true } },
  verifications: { orderBy: { createdAt: 'desc' }, include: { verifier: { select: { name: true } } } },
};

// Link the skills a credential backs. Missing skills are added to the student as self-reported until verified.
async function linkSkills(studentId, credentialId, names) {
  if (!names?.length) return;
  const skills = await ensureSkills(names);
  for (const skill of skills) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.studentSkill.upsert({
      where: { studentId_skillId: { studentId, skillId: skill.id } },
      update: { credentialId },
      create: { studentId, skillId: skill.id, proficiency: 50, credentialId },
    });
  }
}

const createCredential = asyncHandler(async (req, res) => {
  const { skills, ...data } = req.body;
  const studentId = req.user.student.id;
  const cred = await prisma.credential.create({ data: { ...data, studentId } });
  await prisma.credentialVerification.create({
    data: { credentialId: cred.id, decision: 'PENDING', note: 'Submitted for verification' },
  });
  await linkSkills(studentId, cred.id, skills);

  if (req.user.student.institutionId) {
    const inst = await prisma.institution.findUnique({ where: { id: req.user.student.institutionId } });
    if (inst) await notify(inst.userId, 'New credential to verify', `${req.user.name} submitted "${cred.title}".`, '/institution/verification');
  }
  res.status(201).json({ credential: await prisma.credential.findUnique({ where: { id: cred.id }, include }) });
});

// Students see their own credentials; institutions see their students' (optionally filtered by status).
const listCredentials = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (req.user.role === 'STUDENT') where.studentId = req.user.student.id;
  else if (req.user.role === 'INSTITUTION') where.student = { institutionId: req.user.institution.id };
  else throw new HttpError(403, 'Not available for this role');
  const credentials = await prisma.credential.findMany({ where, include, orderBy: { createdAt: 'desc' } });
  res.json({ credentials });
});

async function ownCredential(req) {
  const c = await prisma.credential.findUnique({ where: { id: req.params.id } });
  if (!c || c.studentId !== req.user.student.id) throw new HttpError(404, 'Credential not found');
  return c;
}

// Editing a credential sends it back to PENDING so the institution re-verifies the new details.
const updateCredential = asyncHandler(async (req, res) => {
  const existing = await ownCredential(req);
  const { skills, ...data } = req.body;
  const cred = await prisma.credential.update({
    where: { id: existing.id },
    data: { ...data, status: 'PENDING', rejectionReason: null },
  });
  await prisma.credentialVerification.create({
    data: { credentialId: cred.id, decision: 'PENDING', note: existing.status === 'PENDING' ? 'Details updated' : 'Resubmitted after changes' },
  });
  // A pending resubmission no longer backs skills as verified.
  await prisma.studentSkill.updateMany({
    where: { credentialId: cred.id, status: 'VERIFIED' },
    data: { status: 'PENDING', verifiedAt: null },
  });
  await linkSkills(req.user.student.id, cred.id, skills);
  res.json({ credential: await prisma.credential.findUnique({ where: { id: cred.id }, include }) });
});

const deleteCredential = asyncHandler(async (req, res) => {
  const c = await ownCredential(req);
  // Skills backed only by this credential fall back to self-reported.
  await prisma.$transaction([
    prisma.studentSkill.updateMany({ where: { credentialId: c.id }, data: { status: 'PENDING', verifiedAt: null } }),
    prisma.credential.delete({ where: { id: c.id } }),
  ]);
  res.json({ ok: true });
});

// ---- Verification center (institution) ----
async function institutionCredential(req) {
  const c = await prisma.credential.findUnique({ where: { id: req.params.id }, include });
  if (!c || c.student.institutionId !== req.user.institution.id) throw new HttpError(404, 'Credential not found');
  return c;
}

const pending = asyncHandler(async (req, res) => {
  const credentials = await prisma.credential.findMany({
    where: { status: 'PENDING', student: { institutionId: req.user.institution.id } },
    include,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ credentials });
});

const history = asyncHandler(async (req, res) => {
  const items = await prisma.credentialVerification.findMany({
    where: { decision: { in: ['VERIFIED', 'REJECTED'] }, credential: { student: { institutionId: req.user.institution.id } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      verifier: { select: { name: true } },
      credential: { select: { id: true, title: true, issuer: true, student: { select: { user: { select: { name: true } } } } } },
    },
  });
  res.json({ history: items });
});

const approve = asyncHandler(async (req, res) => {
  const cred = await institutionCredential(req);
  if (cred.status === 'VERIFIED') throw new HttpError(409, 'Credential is already verified');
  const now = new Date();
  await prisma.$transaction([
    prisma.credential.update({ where: { id: cred.id }, data: { status: 'VERIFIED', rejectionReason: null } }),
    prisma.credentialVerification.create({
      data: { credentialId: cred.id, verifierId: req.user.id, decision: 'VERIFIED', note: req.body?.note ?? null },
    }),
    // Skills backed by this credential become verified.
    prisma.studentSkill.updateMany({
      where: { credentialId: cred.id },
      data: { status: 'VERIFIED', verifiedAt: now },
    }),
  ]);
  const student = await prisma.studentProfile.findUnique({ where: { id: cred.studentId } });
  await notify(student.userId, 'Credential verified', `"${cred.title}" was verified by ${req.user.name}.`, '/student/credentials');
  res.json({ credential: await prisma.credential.findUnique({ where: { id: cred.id }, include } ) });
});

const reject = asyncHandler(async (req, res) => {
  const cred = await institutionCredential(req);
  if (cred.status === 'REJECTED') throw new HttpError(409, 'Credential is already rejected');
  await prisma.$transaction([
    prisma.credential.update({ where: { id: cred.id }, data: { status: 'REJECTED', rejectionReason: req.body.reason } }),
    prisma.credentialVerification.create({
      data: { credentialId: cred.id, verifierId: req.user.id, decision: 'REJECTED', note: req.body.reason },
    }),
    prisma.studentSkill.updateMany({ where: { credentialId: cred.id }, data: { status: 'PENDING', verifiedAt: null } }),
  ]);
  const student = await prisma.studentProfile.findUnique({ where: { id: cred.studentId } });
  await notify(student.userId, 'Credential rejected', `"${cred.title}": ${req.body.reason}`, '/student/credentials');
  res.json({ credential: await prisma.credential.findUnique({ where: { id: cred.id }, include }) });
});

module.exports = { createCredential, listCredentials, updateCredential, deleteCredential, pending, history, approve, reject };
