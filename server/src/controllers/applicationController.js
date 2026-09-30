const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { computeMatch } = require('../services/matching');
const { notify } = require('../services/notifications');
const { matchData } = require('./opportunityController');

const STATUS_LABEL = {
  APPLIED: 'Applied', UNDER_REVIEW: 'Under review', SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview', REJECTED: 'Rejected', SELECTED: 'Selected',
};

const createApplication = asyncHandler(async (req, res) => {
  const { opportunityId, coverNote } = req.body;
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { skills: { include: { skill: true } }, employer: true },
  });
  if (!opp || !opp.isActive) throw new HttpError(404, 'Opportunity not found');
  if (opp.deadline < new Date()) throw new HttpError(400, 'The deadline for this opportunity has passed');
  const studentId = req.user.student.id;
  const dup = await prisma.application.findUnique({ where: { studentId_opportunityId: { studentId, opportunityId } } });
  if (dup) throw new HttpError(409, 'You have already applied to this opportunity');

  const student = await matchData(studentId);
  const { score } = computeMatch(student, opp);
  const application = await prisma.application.create({
    data: { studentId, opportunityId, coverNote, matchScore: score },
    include: { opportunity: { select: { id: true, title: true, organization: true } } },
  });
  if (opp.employer) {
    await notify(opp.employer.userId, 'New application', `${req.user.name} applied to ${opp.title} (${score}% match).`, '/employer/applications');
  }
  res.status(201).json({ application });
});

const listApplications = asyncHandler(async (req, res) => {
  const { status, opportunityId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (opportunityId) where.opportunityId = opportunityId;
  if (req.user.role === 'STUDENT') where.studentId = req.user.student.id;
  else if (req.user.role === 'EMPLOYER') where.opportunity = { employerId: req.user.employer.id };
  else throw new HttpError(403, 'Not available for this role');

  const applications = await prisma.application.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      opportunity: { select: { id: true, title: true, organization: true, type: true, location: true } },
      student: {
        select: {
          id: true, username: true, collegeName: true, degree: true, graduationYear: true,
          user: { select: { name: true, avatarUrl: true } },
          skills: { where: { status: 'VERIFIED' }, include: { skill: true }, take: 4 },
        },
      },
    },
  });
  res.json({ applications });
});

const updateStatus = asyncHandler(async (req, res) => {
  const app = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { opportunity: true, student: true },
  });
  if (!app || app.opportunity.employerId !== req.user.employer.id) throw new HttpError(404, 'Application not found');
  const { status } = req.body;
  const updated = await prisma.application.update({ where: { id: app.id }, data: { status } });
  // Keep placement tracking in step with hiring decisions.
  if (status === 'SELECTED') {
    await prisma.studentProfile.update({ where: { id: app.studentId }, data: { placed: true, placedAt: app.opportunity.organization } });
  }
  await notify(
    app.student.userId,
    'Application update',
    `Your application for ${app.opportunity.title} is now: ${STATUS_LABEL[status]}.`,
    '/student/applications',
  );
  res.json({ application: updated });
});

module.exports = { createApplication, listApplications, updateStatus };
