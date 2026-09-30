const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { computeMatch, experienceYears } = require('../services/matching');
const { profileCompletion } = require('../services/completion');
const { studentInclude } = require('../utils/helpers');
const { shapeProfile } = require('./studentController');

const csv = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

// Employers search public student profiles. Match % is relative to an opportunity if given,
// otherwise relative to the skills in the search filter.
const searchCandidates = asyncHandler(async (req, res) => {
  const { q, college, degree, graduationYear, verifiedOnly, minExperience, opportunityId, sort = 'match' } = req.query;
  const skillNames = csv(req.query.skills);

  const where = { isPublic: true };
  if (college) where.collegeName = { contains: String(college), mode: 'insensitive' };
  if (degree) where.degree = { contains: String(degree), mode: 'insensitive' };
  if (graduationYear) where.graduationYear = Number(graduationYear);
  if (q) {
    where.OR = [
      { user: { name: { contains: String(q), mode: 'insensitive' } } },
      { headline: { contains: String(q), mode: 'insensitive' } },
    ];
  }
  // Every requested skill must be present (and verified, when asked).
  const and = skillNames.map((name) => ({
    skills: {
      some: {
        skill: { name: { equals: name, mode: 'insensitive' } },
        ...(verifiedOnly === 'true' ? { status: 'VERIFIED' } : {}),
      },
    },
  }));
  if (and.length) where.AND = and;
  else if (verifiedOnly === 'true') where.skills = { some: { status: 'VERIFIED' } };

  let target = null;
  if (opportunityId) {
    target = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { skills: { include: { skill: true } } },
    });
    if (!target || target.employerId !== req.user.employer.id) throw new HttpError(404, 'Opportunity not found');
  } else if (skillNames.length) {
    target = {
      title: skillNames.join(' '), type: 'JOB', minExperience: 0,
      skills: skillNames.map((name) => ({ skill: { name } })),
    };
  }

  const students = await prisma.studentProfile.findMany({
    where,
    include: { ...studentInclude },
  });

  let candidates = students.map((p) => {
    const years = experienceYears(p.experiences);
    const match = target ? computeMatch(p, target) : null;
    return {
      id: p.id,
      username: p.username,
      name: p.user.name,
      avatarUrl: p.user.avatarUrl,
      headline: p.headline,
      collegeName: p.collegeName,
      degree: p.degree,
      graduationYear: p.graduationYear,
      experienceYears: Number(years.toFixed(1)),
      completion: profileCompletion(p, p.user).score,
      topSkills: p.skills.slice(0, 5).map((s) => ({ name: s.skill.name, verified: s.status === 'VERIFIED' })),
      verifiedSkillCount: p.skills.filter((s) => s.status === 'VERIFIED').length,
      verifiedCredentialCount: p.credentials.filter((c) => c.status === 'VERIFIED').length,
      matchScore: match?.score ?? null,
      matchedSkills: match?.matched.map((m) => m.name) ?? [],
      missingSkills: match?.missing ?? [],
    };
  });

  if (minExperience) candidates = candidates.filter((c) => c.experienceYears >= Number(minExperience));

  const sorters = {
    match: (a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1) || b.verifiedSkillCount - a.verifiedSkillCount,
    verified: (a, b) => b.verifiedSkillCount - a.verifiedSkillCount,
    completion: (a, b) => b.completion - a.completion,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  candidates.sort(sorters[sort] || sorters.match);
  res.json({ candidates });
});

const getCandidate = asyncHandler(async (req, res) => {
  const profile = await prisma.studentProfile.findUnique({ where: { id: req.params.id }, include: studentInclude });
  if (!profile || !profile.isPublic) throw new HttpError(404, 'Candidate not found');
  res.json({ student: shapeProfile(profile, req.user) });
});

module.exports = { searchCandidates, getCandidate };
