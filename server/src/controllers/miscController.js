const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { profileCompletion } = require('../services/completion');

// ---- File uploads (local disk; swap the storage engine for S3/Cloudinary in production) ----
const ALLOWED = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'application/pdf': '.pdf' };
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', '..', 'uploads'),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new HttpError(400, 'Only PNG, JPG, WebP or PDF files up to 5MB are allowed')),
});

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file received');
  res.status(201).json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname });
});

const setAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file received');
  if (!req.file.mimetype.startsWith('image/')) throw new HttpError(400, 'Profile photo must be an image');
  const avatarUrl = `/uploads/${req.file.filename}`;
  await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl } });
  res.json({ avatarUrl });
});

const setResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file received');
  if (req.file.mimetype !== 'application/pdf') throw new HttpError(400, 'Resume must be a PDF');
  const resumeUrl = `/uploads/${req.file.filename}`;
  await prisma.studentProfile.update({ where: { id: req.user.student.id }, data: { resumeUrl } });
  res.json({ resumeUrl });
});

// ---- Notifications ----
const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json({ notifications, unread: notifications.filter((n) => !n.read).length });
});

const markRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, ...(req.params.id === 'all' ? {} : { id: req.params.id }) },
    data: { read: true },
  });
  res.json({ ok: true });
});

// ---- Institution: roster of its students ----
const institutionStudents = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const students = await prisma.studentProfile.findMany({
    where: { institutionId: req.user.institution.id },
    include: {
      user: { select: { name: true, email: true, avatarUrl: true } },
      skills: { include: { skill: true } }, projects: true, credentials: true, experiences: true, achievements: true,
    },
  });
  const rows = students
    .map((s) => ({
      id: s.id,
      username: s.username,
      name: s.user.name,
      email: s.user.email,
      avatarUrl: s.user.avatarUrl,
      degree: s.degree,
      graduationYear: s.graduationYear,
      completion: profileCompletion(s, s.user).score,
      skills: s.skills.length,
      verifiedSkills: s.skills.filter((k) => k.status === 'VERIFIED').length,
      credentials: s.credentials.length,
      pending: s.credentials.filter((c) => c.status === 'PENDING').length,
      placed: s.placed,
      placedAt: s.placedAt,
    }))
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.degree.toLowerCase().includes(q));
  res.json({ students: rows });
});

// Public landing-page numbers, straight from the database.
const publicStats = asyncHandler(async (_req, res) => {
  const [students, verifiedCredentials, opportunities, institutions, employers, applications, verifiedSkills] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.credential.count({ where: { status: 'VERIFIED' } }),
    prisma.opportunity.count({ where: { isActive: true } }),
    prisma.institution.count(),
    prisma.employer.count(),
    prisma.application.count(),
    prisma.studentSkill.count({ where: { status: 'VERIFIED' } }),
  ]);
  res.json({ students, verifiedCredentials, opportunities, institutions, employers, applications, verifiedSkills });
});

module.exports = { publicStats, upload, uploadFile, setAvatar, setResume, listNotifications, markRead, institutionStudents };
