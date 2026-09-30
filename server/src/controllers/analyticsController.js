const prisma = require('../utils/prisma');
const { asyncHandler } = require('../utils/httpError');
const { profileCompletion } = require('../services/completion');
const { computeMatch } = require('../services/matching');
const { matchData } = require('./opportunityController');

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
};
// Last `n` months as ordered keys, so charts have no gaps.
const lastMonths = (n) => {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  return out;
};
const tally = (items, keyFn) => {
  const m = new Map();
  items.forEach((i) => m.set(keyFn(i), (m.get(keyFn(i)) || 0) + 1));
  return m;
};

const student = asyncHandler(async (req, res) => {
  const p = await matchData(req.user.student.id);
  const full = await prisma.studentProfile.findUnique({
    where: { id: p.id },
    include: { skills: { include: { skill: true } }, projects: true, credentials: true, experiences: true, achievements: true },
  });
  const applications = await prisma.application.findMany({ where: { studentId: p.id } });
  const savedCount = await prisma.savedOpportunity.count({ where: { studentId: p.id } });
  const opps = await prisma.opportunity.findMany({
    where: { isActive: true, deadline: { gte: new Date() } },
    include: { skills: { include: { skill: true } } },
  });
  const scores = opps.map((o) => computeMatch(p, o).score);
  const strong = scores.filter((s) => s >= 70).length;
  const completion = profileCompletion(full, req.user);

  const byStatus = tally(applications, (a) => a.status);
  const byCategory = tally(full.skills, (s) => s.skill.category);

  res.json({
    profileStrength: completion.score,
    tips: completion.tips,
    skills: {
      total: full.skills.length,
      verified: full.skills.filter((s) => s.status === 'VERIFIED').length,
      selfReported: full.skills.filter((s) => s.status !== 'VERIFIED').length,
    },
    counts: {
      projects: full.projects.length,
      credentials: full.credentials.length,
      verifiedCredentials: full.credentials.filter((c) => c.status === 'VERIFIED').length,
      pendingCredentials: full.credentials.filter((c) => c.status === 'PENDING').length,
      applications: applications.length,
      saved: savedCount,
    },
    matchRate: {
      average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      strongMatches: strong,
      totalOpen: scores.length,
    },
    skillsByCategory: [...byCategory].map(([name, value]) => ({ name, value })),
    skillProficiency: full.skills.slice().sort((a, b) => b.proficiency - a.proficiency).slice(0, 8)
      .map((s) => ({ name: s.skill.name, proficiency: s.proficiency, verified: s.status === 'VERIFIED' })),
    applicationsByStatus: [...byStatus].map(([status, value]) => ({ status, value })),
  });
});

const institution = asyncHandler(async (req, res) => {
  const id = req.user.institution.id;
  const students = await prisma.studentProfile.findMany({
    where: { institutionId: id },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      skills: { include: { skill: true } }, projects: true, credentials: true, experiences: true, achievements: true,
    },
  });
  const studentIds = students.map((s) => s.id);
  const allCreds = students.flatMap((s) => s.credentials);
  const applications = await prisma.application.findMany({
    where: { studentId: { in: studentIds } },
    include: { opportunity: { select: { type: true, title: true, organization: true } } },
  });
  const verifications = await prisma.credentialVerification.findMany({
    where: { decision: 'VERIFIED', credential: { student: { institutionId: id } } },
  });

  const completions = students.map((s) => profileCompletion(s, s.user).score);
  const skillCount = tally(students.flatMap((s) => s.skills), (s) => s.skill.name);
  const categoryCount = tally(students.flatMap((s) => s.skills), (s) => s.skill.category);
  const months = lastMonths(6);
  const vByMonth = tally(verifications, (v) => monthKey(v.createdAt));
  const sByMonth = tally(allCreds, (c) => monthKey(c.createdAt));
  const placed = students.filter((s) => s.placed);
  const appliedStudents = new Set(applications.map((a) => a.studentId));
  const outcomes = tally(applications, (a) => a.status);
  const placementByCompany = tally(placed, (s) => s.placedAt || 'Other');

  res.json({
    totals: {
      students: students.length,
      verifiedCredentials: allCreds.filter((c) => c.status === 'VERIFIED').length,
      pendingVerifications: allCreds.filter((c) => c.status === 'PENDING').length,
      rejectedCredentials: allCreds.filter((c) => c.status === 'REJECTED').length,
      averageCompletion: completions.length ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length) : 0,
      placed: placed.length,
      placementRate: students.length ? Math.round((placed.length / students.length) * 100) : 0,
      participation: students.length ? Math.round((appliedStudents.size / students.length) * 100) : 0,
      applications: applications.length,
    },
    topSkills: [...skillCount].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value })),
    skillsByCategory: [...categoryCount].map(([name, value]) => ({ name, value })),
    credentialsOverTime: months.map((m) => ({
      month: monthLabel(m), submitted: sByMonth.get(m) || 0, verified: vByMonth.get(m) || 0,
    })),
    applicationOutcomes: [...outcomes].map(([status, value]) => ({ status, value })),
    participationByType: [...tally(applications, (a) => a.opportunity.type)].map(([type, value]) => ({ type, value })),
    placementByCompany: [...placementByCompany].map(([name, value]) => ({ name, value })),
  });
});

const employer = asyncHandler(async (req, res) => {
  const id = req.user.employer.id;
  const opportunities = await prisma.opportunity.findMany({
    where: { employerId: id },
    include: { _count: { select: { applications: true } } },
  });
  const applications = await prisma.application.findMany({ where: { opportunity: { employerId: id } } });
  const pipeline = tally(applications, (a) => a.status);
  const months = lastMonths(6);
  const aByMonth = tally(applications, (a) => monthKey(a.createdAt));
  const totalViews = opportunities.reduce((s, o) => s + o.views, 0);
  const hired = applications.filter((a) => a.status === 'SELECTED').length;

  res.json({
    totals: {
      opportunities: opportunities.length,
      active: opportunities.filter((o) => o.isActive && o.deadline >= new Date()).length,
      views: totalViews,
      applications: applications.length,
      shortlisted: applications.filter((a) => ['SHORTLISTED', 'INTERVIEW'].includes(a.status)).length,
      hired,
      hireRate: applications.length ? Math.round((hired / applications.length) * 100) : 0,
      avgMatch: applications.length ? Math.round(applications.reduce((s, a) => s + a.matchScore, 0) / applications.length) : 0,
    },
    jobViews: opportunities.map((o) => ({ name: o.title.length > 22 ? `${o.title.slice(0, 20)}…` : o.title, views: o.views, applications: o._count.applications })),
    pipeline: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'].map((status) => ({ status, value: pipeline.get(status) || 0 })),
    applicationsOverTime: months.map((m) => ({ month: monthLabel(m), applications: aByMonth.get(m) || 0 })),
  });
});

module.exports = { student, institution, employer };
