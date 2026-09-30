const { z } = require('zod');

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\/.+/i.test(v), 'Must be a valid http(s) URL')
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const optionalText = (max = 2000) =>
  z.string().trim().max(max).optional().nullable().transform((v) => (v ? v : null));

const dateLike = z.coerce.date();
const optionalDate = z
  .union([z.string().trim().length(0), z.null(), z.undefined(), z.coerce.date()])
  .transform((v) => (v ? new Date(v) : null));

const password = z.string().min(8, 'Password must be at least 8 characters').max(100);
const email = z.string().trim().toLowerCase().email('Enter a valid email');

const registerSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('STUDENT'),
    name: z.string().trim().min(2).max(100),
    email,
    password,
    college: z.string().trim().min(2).max(150),
    degree: z.string().trim().min(2).max(100),
    graduationYear: z.coerce.number().int().min(2015).max(2040),
    skills: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  }),
  z.object({
    role: z.literal('INSTITUTION'),
    institutionName: z.string().trim().min(2).max(150),
    email,
    password,
  }),
  z.object({
    role: z.literal('EMPLOYER'),
    companyName: z.string().trim().min(2).max(150),
    recruiterName: z.string().trim().min(2).max(100),
    email,
    password,
  }),
]);

const loginSchema = z.object({
  email,
  password: z.string().min(1),
  role: z.enum(['STUDENT', 'INSTITUTION', 'EMPLOYER']),
});

const studentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  headline: optionalText(150),
  bio: optionalText(1500),
  collegeName: z.string().trim().min(2).max(150).optional(),
  degree: z.string().trim().min(2).max(100).optional(),
  branch: optionalText(100),
  graduationYear: z.coerce.number().int().min(2015).max(2040).optional(),
  location: optionalText(100),
  interests: z.array(z.string().trim().min(1).max(50)).max(15).optional(),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  isPublic: z.boolean().optional(),
});

const projectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(2000),
  technologies: z.array(z.string().trim().min(1).max(40)).min(1, 'Add at least one technology').max(20),
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  imageUrl: optionalUrl,
  startDate: optionalDate,
  endDate: optionalDate,
  teamSize: z.coerce.number().int().min(1).max(50).default(1),
});

const credentialSchema = z.object({
  type: z.enum(['CERTIFICATION', 'WORKSHOP', 'HACKATHON', 'ACHIEVEMENT']),
  title: z.string().trim().min(2).max(150),
  issuer: z.string().trim().min(2).max(150),
  issuedOn: dateLike,
  credentialId: optionalText(100),
  documentUrl: optionalUrl,
  description: optionalText(1000),
  skills: z.array(z.string().trim().min(1).max(50)).max(15).optional(),
});

const studentSkillSchema = z.object({
  name: z.string().trim().min(1).max(50),
  category: z.string().trim().min(1).max(50).optional(),
  proficiency: z.coerce.number().int().min(1).max(100),
  evidence: optionalText(500),
});

const achievementSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: optionalText(1000),
  date: optionalDate,
});

const experienceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(120),
  description: optionalText(1000),
  startDate: dateLike,
  endDate: optionalDate,
});

const opportunitySchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20).max(5000),
  type: z.enum(['INTERNSHIP', 'JOB', 'HACKATHON', 'SCHOLARSHIP', 'COMPETITION', 'WORKSHOP']),
  location: z.string().trim().min(2).max(120),
  workMode: z.enum(['REMOTE', 'ONSITE', 'HYBRID']),
  skills: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  minExperience: z.coerce.number().int().min(0).max(20).default(0),
  deadline: dateLike,
  compensation: optionalText(100),
  applicationUrl: optionalUrl,
  isActive: z.boolean().optional(),
});

const applicationCreateSchema = z.object({
  opportunityId: z.string().uuid(),
  coverNote: optionalText(1000),
});

const applicationStatusSchema = z.object({
  status: z.enum(['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'SELECTED']),
});

const rejectSchema = z.object({ reason: z.string().trim().min(3, 'Give a short reason').max(500) });

module.exports = {
  registerSchema,
  loginSchema,
  studentUpdateSchema,
  projectSchema,
  credentialSchema,
  studentSkillSchema,
  achievementSchema,
  experienceSchema,
  opportunitySchema,
  applicationCreateSchema,
  applicationStatusSchema,
  rejectSchema,
};
