const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');

// Builds create/update/delete(/get) handlers for records owned by a student (projects, achievements, experiences).
function ownedCrud(model, label) {
  const findOwned = async (req) => {
    const row = await prisma[model].findUnique({ where: { id: req.params.id } });
    if (!row || row.studentId !== req.user.student.id) throw new HttpError(404, `${label} not found`);
    return row;
  };
  return {
    create: asyncHandler(async (req, res) => {
      const row = await prisma[model].create({ data: { ...req.body, studentId: req.user.student.id } });
      res.status(201).json({ [model]: row });
    }),
    update: asyncHandler(async (req, res) => {
      await findOwned(req);
      const row = await prisma[model].update({ where: { id: req.params.id }, data: req.body });
      res.json({ [model]: row });
    }),
    remove: asyncHandler(async (req, res) => {
      await findOwned(req);
      await prisma[model].delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    }),
    // Viewable by the owner, their institution, and employers (when the profile is public).
    get: asyncHandler(async (req, res) => {
      const row = await prisma[model].findUnique({ where: { id: req.params.id }, include: { student: { include: { user: { select: { name: true } } } } } });
      if (!row) throw new HttpError(404, `${label} not found`);
      const p = row.student;
      const u = req.user;
      const allowed =
        (u.role === 'STUDENT' && u.student?.id === p.id) ||
        (u.role === 'INSTITUTION' && u.institution?.id === p.institutionId) ||
        (u.role === 'EMPLOYER' && p.isPublic);
      if (!allowed) throw new HttpError(403, 'You cannot view this record');
      const { student, ...rest } = row;
      res.json({ [model]: { ...rest, owner: { name: student.user.name, username: student.username } } });
    }),
  };
}

module.exports = {
  projects: ownedCrud('project', 'Project'),
  achievements: ownedCrud('achievement', 'Achievement'),
  experiences: ownedCrud('experience', 'Experience'),
};
