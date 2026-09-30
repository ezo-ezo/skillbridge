const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { signToken } = require('../middleware/auth');
const { uniqueUsername, ensureSkills } = require('../utils/helpers');
const { profileCompletion } = require('../services/completion');

// Shape returned to the client. Never includes the password hash.
async function toClientUser(user) {
  const base = { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl };
  if (user.role === 'STUDENT' && user.student) {
    const full = await prisma.studentProfile.findUnique({
      where: { id: user.student.id },
      include: { skills: true, projects: true, credentials: true, experiences: true, achievements: true },
    });
    return {
      ...base,
      profile: {
        id: full.id,
        username: full.username,
        collegeName: full.collegeName,
        degree: full.degree,
        graduationYear: full.graduationYear,
        completion: profileCompletion(full, user).score,
      },
    };
  }
  if (user.role === 'INSTITUTION' && user.institution) {
    return { ...base, profile: { id: user.institution.id, name: user.institution.name } };
  }
  if (user.role === 'EMPLOYER' && user.employer) {
    return { ...base, profile: { id: user.employer.id, companyName: user.employer.companyName } };
  }
  return base;
}

const register = asyncHandler(async (req, res) => {
  const body = req.body;
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(body.password, 10);
  let user;

  if (body.role === 'STUDENT') {
    const username = await uniqueUsername(body.name);
    const institution = await prisma.institution.findFirst({
      where: { name: { equals: body.college, mode: 'insensitive' } },
    });
    user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: 'STUDENT',
        name: body.name,
        student: {
          create: {
            username,
            collegeName: body.college,
            degree: body.degree,
            graduationYear: body.graduationYear,
            institutionId: institution?.id ?? null,
          },
        },
      },
      include: { student: true, institution: true, employer: true },
    });
    const skills = await ensureSkills(body.skills);
    if (skills.length) {
      await prisma.studentSkill.createMany({
        data: skills.map((s) => ({ studentId: user.student.id, skillId: s.id, proficiency: 50 })),
      });
    }
  } else if (body.role === 'INSTITUTION') {
    user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: 'INSTITUTION',
        name: body.institutionName,
        institution: { create: { name: body.institutionName } },
      },
      include: { student: true, institution: true, employer: true },
    });
    // Adopt students who registered with this college name before the institution joined.
    await prisma.studentProfile.updateMany({
      where: { institutionId: null, collegeName: { equals: body.institutionName, mode: 'insensitive' } },
      data: { institutionId: user.institution.id },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: 'EMPLOYER',
        name: body.recruiterName,
        employer: { create: { companyName: body.companyName, recruiter: body.recruiterName } },
      },
      include: { student: true, institution: true, employer: true },
    });
  }

  res.status(201).json({ token: signToken(user), user: await toClientUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { student: true, institution: true, employer: true },
  });
  // Same message for unknown email / wrong password / wrong role to avoid account enumeration.
  const ok = user && user.role === role && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Invalid email, password or role');
  res.json({ token: signToken(user), user: await toClientUser(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: await toClientUser(req.user) });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name: req.body.name },
    include: { student: true, institution: true, employer: true },
  });
  res.json({ user: await toClientUser(user) });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) throw new HttpError(400, 'Current password is incorrect');
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  res.json({ ok: true });
});

module.exports = { register, login, me, updateMe, changePassword, toClientUser };
