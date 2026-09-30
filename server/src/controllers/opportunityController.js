const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { ensureSkills } = require('../utils/helpers');
const { computeMatch } = require('../services/matching');
const { explainMatch } = require('../services/ai');

const oppInclude = {
  skills: { include: { skill: true } },
  employer: { select: { id: true, companyName: true } },
  _count: { select: { applications: true } },
};

// Everything the matching engine needs about a student.
const matchData = (studentId) =>
  prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { skills: { include: { skill: true } }, projects: true, experiences: true },
  });

const flatten = (o) => ({
  ...o,
  skills: o.skills.map((s) => ({ id: s.skill.id, name: s.skill.name, category: s.skill.category })),
  applicationCount: o._count?.applications,
  _count: undefined,
});

// Attach match / saved / applied info for a student viewer.
async function decorateForStudent(opps, student) {
  const [saved, applied] = await Promise.all([
    prisma.savedOpportunity.findMany({ where: { studentId: student.id }, select: { opportunityId: true } }),
    prisma.application.findMany({ where: { studentId: student.id }, select: { opportunityId: true, status: true } }),
  ]);
  const savedSet = new Set(saved.map((s) => s.opportunityId));
  const appliedMap = new Map(applied.map((a) => [a.opportunityId, a.status]));
  return opps.map((o) => {
    const m = computeMatch(student, o);
    return {
      ...flatten(o),
      match: { score: m.score, matched: m.matched, missing: m.missing },
      saved: savedSet.has(o.id),
      applicationStatus: appliedMap.get(o.id) ?? null,
    };
  });
}

const SORTS = {
  newest: { postedAt: 'desc' },
  deadline: { deadline: 'asc' },
  title: { title: 'asc' },
};

const listOpportunities = asyncHandler(async (req, res) => {
  const { q, type, workMode, skill, sort = 'newest', mine, saved, includeExpired } = req.query;
  const where = {};
  if (req.user.role === 'EMPLOYER' && mine === 'true') where.employerId = req.user.employer.id;
  else where.isActive = true;
  if (!(req.user.role === 'EMPLOYER' && mine === 'true') && includeExpired !== 'true') where.deadline = { gte: new Date() };
  if (type) where.type = type;
  if (workMode) where.workMode = workMode;
  if (q) {
    where.OR = [
      { title: { contains: String(q), mode: 'insensitive' } },
      { organization: { contains: String(q), mode: 'insensitive' } },
      { description: { contains: String(q), mode: 'insensitive' } },
    ];
  }
  if (skill) where.skills = { some: { skill: { name: { in: String(skill).split(','), mode: 'insensitive' } } } };
  if (saved === 'true' && req.user.role === 'STUDENT') where.saved = { some: { studentId: req.user.student.id } };

  const opps = await prisma.opportunity.findMany({
    where,
    include: oppInclude,
    orderBy: SORTS[sort] || SORTS.newest,
  });

  if (req.user.role === 'STUDENT') {
    const student = await matchData(req.user.student.id);
    let out = await decorateForStudent(opps, student);
    if (sort === 'match') out = out.sort((a, b) => b.match.score - a.match.score);
    return res.json({ opportunities: out });
  }
  res.json({ opportunities: opps.map(flatten) });
});

const getOpportunity = asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id }, include: oppInclude });
  if (!opp) throw new HttpError(404, 'Opportunity not found');
  if (req.user.role === 'STUDENT') {
    await prisma.opportunity.update({ where: { id: opp.id }, data: { views: { increment: 1 } } });
    const student = await matchData(req.user.student.id);
    const [decorated] = await decorateForStudent([opp], student);
    return res.json({ opportunity: decorated });
  }
  res.json({ opportunity: flatten(opp) });
});

const createOpportunity = asyncHandler(async (req, res) => {
  const { skills, ...data } = req.body;
  const skillRows = await ensureSkills(skills);
  const opp = await prisma.opportunity.create({
    data: {
      ...data,
      organization: req.user.employer.companyName,
      employerId: req.user.employer.id,
      skills: { create: skillRows.map((s) => ({ skillId: s.id })) },
    },
    include: oppInclude,
  });
  res.status(201).json({ opportunity: flatten(opp) });
});

async function ownOpportunity(req) {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
  if (!opp || opp.employerId !== req.user.employer.id) throw new HttpError(404, 'Opportunity not found');
  return opp;
}

const updateOpportunity = asyncHandler(async (req, res) => {
  await ownOpportunity(req);
  const { skills, ...data } = req.body;
  const skillRows = await ensureSkills(skills);
  const opp = await prisma.opportunity.update({
    where: { id: req.params.id },
    data: {
      ...data,
      skills: { deleteMany: {}, create: skillRows.map((s) => ({ skillId: s.id })) },
    },
    include: oppInclude,
  });
  res.json({ opportunity: flatten(opp) });
});

const deleteOpportunity = asyncHandler(async (req, res) => {
  await ownOpportunity(req);
  await prisma.opportunity.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ---- Matching ----
const myMatches = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const opps = await prisma.opportunity.findMany({
    where: { isActive: true, deadline: { gte: new Date() } },
    include: oppInclude,
  });
  const student = await matchData(req.user.student.id);
  const decorated = (await decorateForStudent(opps, student))
    .filter((o) => !o.applicationStatus)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
  res.json({ matches: decorated });
});

const opportunityMatch = asyncHandler(async (req, res) => {
  const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id }, include: oppInclude });
  if (!opp) throw new HttpError(404, 'Opportunity not found');
  const student = await matchData(req.user.student.id);
  const match = computeMatch(student, opp);
  const why = await explainMatch(
    {
      id: student.id,
      degree: student.degree,
      verifiedSkills: student.skills.filter((s) => s.status === 'VERIFIED').map((s) => s.skill.name),
      selfReportedSkills: student.skills.filter((s) => s.status !== 'VERIFIED').map((s) => s.skill.name),
    },
    opp,
    match,
  );
  res.json({ match: { ...match, explanation: why.text, explanationSource: why.source } });
});

// ---- Saved ----
const toggleSave = asyncHandler(async (req, res) => {
  const studentId = req.user.student.id;
  const opportunityId = req.params.id;
  const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new HttpError(404, 'Opportunity not found');
  const existing = await prisma.savedOpportunity.findUnique({ where: { studentId_opportunityId: { studentId, opportunityId } } });
  if (existing) {
    await prisma.savedOpportunity.delete({ where: { id: existing.id } });
    return res.json({ saved: false });
  }
  await prisma.savedOpportunity.create({ data: { studentId, opportunityId } });
  res.json({ saved: true });
});

module.exports = {
  listOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity,
  myMatches, opportunityMatch, toggleSave, matchData,
};
