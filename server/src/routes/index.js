const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const s = require('../utils/schemas');

const auth = require('../controllers/authController');
const students = require('../controllers/studentController');
const portfolio = require('../controllers/portfolioController');
const creds = require('../controllers/credentialController');
const opps = require('../controllers/opportunityController');
const apps = require('../controllers/applicationController');
const candidates = require('../controllers/candidateController');
const analytics = require('../controllers/analyticsController');
const misc = require('../controllers/miscController');

const router = Router();
const STUDENT = authorize('STUDENT');
const INSTITUTION = authorize('INSTITUTION');
const EMPLOYER = authorize('EMPLOYER');

// Brute-force protection on credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Auth
router.post('/auth/register', authLimiter, validate(s.registerSchema), auth.register);
router.post('/auth/login', authLimiter, validate(s.loginSchema), auth.login);
router.get('/auth/me', authenticate, auth.me);
router.put('/auth/me', authenticate, validate(s.profileNameSchema), auth.updateMe);
router.put('/auth/password', authenticate, authLimiter, validate(s.passwordChangeSchema), auth.changePassword);
router.post('/users/me/avatar', authenticate, misc.upload.single('file'), misc.setAvatar);

router.get('/stats/public', misc.publicStats);

// Public portfolio (no auth)
router.get('/profiles/:username', students.publicProfile);

// Everything below requires a logged-in user.
router.use(authenticate);

// Students
router.get('/students/:id', students.getStudent);
router.put('/students/:id', STUDENT, validate(s.studentUpdateSchema), students.updateStudent);
router.post('/students/me/avatar', STUDENT, misc.upload.single('file'), misc.setAvatar);
router.post('/students/me/resume', STUDENT, misc.upload.single('file'), misc.setResume);
router.post('/uploads', misc.upload.single('file'), misc.uploadFile);

// Skills
router.get('/skills', students.listSkillCatalog);
router.post('/student-skills', STUDENT, validate(s.studentSkillSchema), students.addSkill);
router.put('/student-skills/:id', STUDENT, validate(s.studentSkillSchema.partial()), students.updateSkill);
router.delete('/student-skills/:id', STUDENT, students.deleteSkill);

// Portfolio records
router.post('/projects', STUDENT, validate(s.projectSchema), portfolio.projects.create);
router.get('/projects/:id', portfolio.projects.get);
router.put('/projects/:id', STUDENT, validate(s.projectSchema), portfolio.projects.update);
router.delete('/projects/:id', STUDENT, portfolio.projects.remove);
router.post('/achievements', STUDENT, validate(s.achievementSchema), portfolio.achievements.create);
router.put('/achievements/:id', STUDENT, validate(s.achievementSchema), portfolio.achievements.update);
router.delete('/achievements/:id', STUDENT, portfolio.achievements.remove);
router.post('/experiences', STUDENT, validate(s.experienceSchema), portfolio.experiences.create);
router.put('/experiences/:id', STUDENT, validate(s.experienceSchema), portfolio.experiences.update);
router.delete('/experiences/:id', STUDENT, portfolio.experiences.remove);

// Credentials
router.post('/credentials', STUDENT, validate(s.credentialSchema), creds.createCredential);
router.get('/credentials', authorize('STUDENT', 'INSTITUTION'), creds.listCredentials);
router.put('/credentials/:id', STUDENT, validate(s.credentialSchema), creds.updateCredential);
router.delete('/credentials/:id', STUDENT, creds.deleteCredential);

// Verification center
router.get('/verification/pending', INSTITUTION, creds.pending);
router.get('/verification/history', INSTITUTION, creds.history);
router.post('/verification/:id/approve', INSTITUTION, creds.approve);
router.post('/verification/:id/reject', INSTITUTION, validate(s.rejectSchema), creds.reject);
router.get('/institution/students', INSTITUTION, misc.institutionStudents);

// Opportunities
router.get('/opportunities', opps.listOpportunities);
router.post('/opportunities', EMPLOYER, validate(s.opportunitySchema), opps.createOpportunity);
router.get('/opportunities/:id', opps.getOpportunity);
router.put('/opportunities/:id', EMPLOYER, validate(s.opportunitySchema), opps.updateOpportunity);
router.delete('/opportunities/:id', EMPLOYER, opps.deleteOpportunity);
router.post('/opportunities/:id/save', STUDENT, opps.toggleSave);
router.get('/opportunities/:id/match', STUDENT, opps.opportunityMatch);
router.get('/matches', STUDENT, opps.myMatches);

// Applications
router.post('/applications', STUDENT, validate(s.applicationCreateSchema), apps.createApplication);
router.get('/applications', authorize('STUDENT', 'EMPLOYER'), apps.listApplications);
router.put('/applications/:id/status', EMPLOYER, validate(s.applicationStatusSchema), apps.updateStatus);

// Employer talent search
router.get('/candidates', EMPLOYER, candidates.searchCandidates);
router.get('/candidates/:id', EMPLOYER, candidates.getCandidate);

// Analytics
router.get('/analytics/student', STUDENT, analytics.student);
router.get('/analytics/institution', INSTITUTION, analytics.institution);
router.get('/analytics/employer', EMPLOYER, analytics.employer);

// Notifications
router.get('/notifications', misc.listNotifications);
router.put('/notifications/:id/read', misc.markRead);

module.exports = router;
