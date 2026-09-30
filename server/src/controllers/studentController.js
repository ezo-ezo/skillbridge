const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { studentInclude, ensureSkills, pick } = require('../utils/helpers');
const { profileCompletion } = require('../services/completion');
const { experienceYears } = require('../services/matching');

const PROFILE_FIELDS = [
  'headline', 'bio', 'collegeName', 'degree', 'branch', 'graduationYear',
  'location', 'interests', 'githubUrl', 'linkedinUrl', 'portfolioUrl', 'isPublic',
];

// What a given viewer is allowed to see of a student's profile.
function shapeProfile(profile, viewer) {
  const isOwner = viewer?.role === 'STUDENT' && viewer.student?.id === profile.id;
  const isOwnInstitution = viewer?.role === 'INSTITUTION' && viewer.institution?.id === profile.institutionId;
  const full = isOwner || isOwnInstitution;
  const { user, ...rest } = profile;
  const shaped = {
    ...rest,
    name: user.name,
    avatarUrl: user.avatarUrl,
    email: full || viewer?.role === 'EMPLOYER' ? user.email : undefined,
    // Only verified credentials are visible outside the owner and their institution.
    credentials: full ? profile.credentials : profile.credentials.filter((c) => c.status === 'VERIFIED'),
    experienceYears: Number(experienceYears(profile.experiences).toFixed(1)),
  };
  if (full) shaped.completion = profileCompletion(profile, user);
  else shaped.completion = { score: profileCompletion(profile, user).score };
  return shaped;
}

// Resolves :id (profile id, or "me") and enforces who may read it.
async function loadStudentFor(req, idParam) {
  const id = idParam === 'me' ? req.user.student?.id : idParam;
  if (!id) throw new HttpError(404, 'Student not found');
  const profile = await prisma.studentProfile.findUnique({ where: { id }, include: studentInclude });
  if (!profile) throw new HttpError(404, 'Student not found');
  const isOwner = req.user.role === 'STUDENT' && req.user.student?.id === profile.id;
  const isOwnInstitution = req.user.role === 'INSTITUTION' && req.user.institution?.id === profile.institutionId;
  const isEmployer = req.user.role === 'EMPLOYER' && profile.isPublic;
  if (!isOwner && !isOwnInstitution && !isEmployer) throw new HttpError(403, 'You cannot view this profile');
  return profile;
}

const getStudent = asyncHandler(async (req, res) => {
  const profile = await loadStudentFor(req, req.params.id);
  res.json({ student: shapeProfile(profile, req.user) });
});

const updateStudent = asyncHandler(async (req, res) => {
  const id = req.params.id === 'me' ? req.user.student.id : req.params.id;
  if (id !== req.user.student.id) throw new HttpError(403, 'You can only edit your own profile');
  const data = pick(req.body, PROFILE_FIELDS);
  const ops = [prisma.studentProfile.update({ where: { id }, data })];
  if (req.body.name) ops.push(prisma.user.update({ where: { id: req.user.id }, data: { name: req.body.name } }));
  await prisma.$transaction(ops);
  const profile = await prisma.studentProfile.findUnique({ where: { id }, include: studentInclude });
  res.json({ student: shapeProfile(profile, req.user) });
});

// Public, unauthenticated portfolio. Verified credentials only, no email.
const publicProfile = asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({
    where: { username: req.params.username },
    include: studentInclude,
  });
  if (!profile || !profile.isPublic) throw new HttpError(404, 'Profile not found');
  const verifiedCreds = profile.credentials
    .filter((c) => c.status === 'VERIFIED')
    .map(({ verifications, ...c }) => ({
      ...c,
      verifiedBy: verifications.find((v) => v.decision === 'VERIFIED')?.verifier?.name ?? null,
      verifiedAt: verifications.find((v) => v.decision === 'VERIFIED')?.createdAt ?? null,
    }));
  res.json({
    student: {
      username: profile.username,
      name: profile.user.name,
      avatarUrl: profile.user.avatarUrl,
      headline: profile.headline,
      bio: profile.bio,
      collegeName: profile.collegeName,
      degree: profile.degree,
      branch: profile.branch,
      graduationYear: profile.graduationYear,
      location: profile.location,
      githubUrl: profile.githubUrl,
      linkedinUrl: profile.linkedinUrl,
      portfolioUrl: profile.portfolioUrl,
      interests: profile.interests,
      skills: profile.skills.map((s) => ({
        id: s.id, name: s.skill.name, category: s.skill.category, proficiency: s.proficiency, status: s.status,
      })),
      projects: profile.projects,
      credentials: verifiedCreds,
      achievements: profile.achievements,
      experiences: profile.experiences,
      completion: profileCompletion(profile, profile.user).score,
    },
  });
});

// ---- Skills (student-owned) ----
const listSkillCatalog = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const skills = await prisma.skill.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' },
    take: 100,
  });
  res.json({ skills });
});

const addSkill = asyncHandler(async (req, res) => {
  const { name, category, proficiency, evidence } = req.body;
  const [skill] = await ensureSkills([name], category || 'General');
  const studentId = req.user.student.id;
  const existing = await prisma.studentSkill.findUnique({ where: { studentId_skillId: { studentId, skillId: skill.id } } });
  if (existing) throw new HttpError(409, `You already have ${skill.name} on your profile`);
  const created = await prisma.studentSkill.create({
    data: { studentId, skillId: skill.id, proficiency, evidence },
    include: { skill: true },
  });
  res.status(201).json({ skill: created });
});

async function ownSkill(req) {
  const s = await prisma.studentSkill.findUnique({ where: { id: req.params.id }, include: { skill: true } });
  if (!s || s.studentId !== req.user.student.id) throw new HttpError(404, 'Skill not found');
  return s;
}

const updateSkill = asyncHandler(async (req, res) => {
  await ownSkill(req);
  const updated = await prisma.studentSkill.update({
    where: { id: req.params.id },
    data: { proficiency: req.body.proficiency, evidence: req.body.evidence },
    include: { skill: true },
  });
  res.json({ skill: updated });
});

const deleteSkill = asyncHandler(async (req, res) => {
  await ownSkill(req);
  await prisma.studentSkill.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = {
  getStudent, updateStudent, publicProfile, listSkillCatalog, addSkill, updateSkill, deleteSkill,
  shapeProfile, loadStudentFor,
};
