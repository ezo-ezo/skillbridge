const prisma = require('./prisma');

const studentInclude = {
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
  institution: { select: { id: true, name: true } },
  skills: { include: { skill: true }, orderBy: { proficiency: 'desc' } },
  projects: { orderBy: { createdAt: 'desc' } },
  credentials: {
    orderBy: { issuedOn: 'desc' },
    include: {
      verifications: {
        orderBy: { createdAt: 'desc' },
        include: { verifier: { select: { name: true } } },
      },
    },
  },
  achievements: { orderBy: { date: 'desc' } },
  experiences: { orderBy: { startDate: 'desc' } },
};

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'student';

async function uniqueUsername(name) {
  const base = slugify(name);
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.studentProfile.findUnique({ where: { username: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

// Find-or-create skills by name (case-insensitive). Returns Skill rows.
async function ensureSkills(names, category = 'General') {
  const out = [];
  for (const raw of [...new Set(names.map((n) => n.trim()).filter(Boolean))]) {
    // eslint-disable-next-line no-await-in-loop
    let skill = await prisma.skill.findFirst({ where: { name: { equals: raw, mode: 'insensitive' } } });
    // eslint-disable-next-line no-await-in-loop
    if (!skill) skill = await prisma.skill.create({ data: { name: raw, category } });
    out.push(skill);
  }
  return out;
}

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

module.exports = { studentInclude, slugify, uniqueUsername, ensureSkills, pick };
