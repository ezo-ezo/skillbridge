/* Demo data for SkillBridge. Wipes the database and recreates it. Run: npm run db:seed */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo@1234';

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86400000);
const daysAhead = (n) => new Date(now + n * 86400000);

// ---------- Skill catalog ----------
const SKILLS = {
  Frontend: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Tailwind CSS', 'Next.js'],
  Backend: ['Node.js', 'Express.js', 'Django', 'Spring Boot', 'REST APIs'],
  Database: ['PostgreSQL', 'MongoDB', 'SQL', 'Redis'],
  'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
  'Data & AI': ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'Data Visualization'],
  Programming: ['Java', 'C++', 'Data Structures', 'Go'],
  Tools: ['Git', 'Figma', 'Postman'],
};
const SOFT = ['Communication', 'Teamwork', 'Leadership', 'Problem Solving'];

// ---------- People ----------
const INSTITUTIONS = [
  { email: 'institution@skillbridge.demo', name: 'Sahyadri Institute of Technology', city: 'Bengaluru', domain: 'sahyadri.edu.in' },
  { email: 'institution2@skillbridge.demo', name: 'Aravali College of Engineering', city: 'Gurugram', domain: 'aravali.edu.in' },
];

const EMPLOYERS = [
  { email: 'employer@skillbridge.demo', company: 'Nimbus Labs', recruiter: 'Meera Krishnan', industry: 'Cloud Software', website: 'https://nimbuslabs.example' },
  { email: 'hr@skillbridge.demo', company: 'CloudKart', recruiter: 'Arjun Malhotra', industry: 'E-commerce', website: 'https://cloudkart.example' },
  { email: 'talent@skillbridge.demo', company: 'FinEdge Technologies', recruiter: 'Divya Raman', industry: 'FinTech', website: 'https://finedge.example' },
];

// skills: [name, proficiency]. Verification comes from credentials (status + skills they back).
const STUDENTS = [
  {
    email: 'student@skillbridge.demo', name: 'Aarav Sharma', username: 'aarav-sharma', inst: 0,
    degree: 'B.Tech Computer Science', branch: 'CSE', year: 2026, location: 'Bengaluru, KA',
    headline: 'Full-stack developer who ships clean, tested products',
    bio: 'Final-year CS student building web products with React and Node. I care about accessible UI and reliable backends, and I mentor juniors in the college coding club.',
    interests: ['Frontend', 'Full Stack', 'Web'], github: 'https://github.com/aarav-sharma-dev', linkedin: 'https://linkedin.com/in/aarav-sharma-dev',
    skills: [['React', 85], ['JavaScript', 88], ['HTML/CSS', 90], ['Node.js', 72], ['Express.js', 70], ['Git', 80], ['PostgreSQL', 60], ['Python', 75], ['TypeScript', 45], ['Communication', 80], ['Teamwork', 85]],
    credentials: [
      { type: 'CERTIFICATION', title: 'Meta Front-End Developer Professional Certificate', issuer: 'Coursera / Meta', days: 150, status: 'VERIFIED', skills: ['React', 'JavaScript', 'HTML/CSS'] },
      { type: 'CERTIFICATION', title: 'Node.js & Express Backend Development', issuer: 'Udemy', days: 110, status: 'VERIFIED', skills: ['Node.js', 'Express.js'] },
      { type: 'CERTIFICATION', title: 'Git & GitHub Workflows', issuer: 'Sahyadri Coding Club', days: 95, status: 'VERIFIED', skills: ['Git'] },
      { type: 'HACKATHON', title: 'Smart India Hackathon 2025 - Finalist', issuer: 'Ministry of Education, Govt. of India', days: 60, status: 'VERIFIED', skills: ['Problem Solving', 'Teamwork'] },
      { type: 'CERTIFICATION', title: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', days: 12, status: 'PENDING', skills: ['AWS'] },
      { type: 'WORKSHOP', title: 'TypeScript Deep Dive Workshop', issuer: 'GDG Bengaluru', days: 5, status: 'PENDING', skills: ['TypeScript'] },
    ],
    projects: [
      { title: 'CampusConnect', description: 'A placement-preparation platform with mock interviews, resource sharing and peer leaderboards, used by 400+ students at college.', tech: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'], team: 4, months: 5 },
      { title: 'ExpenseSplit', description: 'Splitwise-style expense tracker with group settlements, receipts upload and monthly insights charts.', tech: ['React', 'Express.js', 'MongoDB'], team: 2, months: 3 },
      { title: 'CodeCanvas', description: 'Browser-based code snippet manager with syntax highlighting, tagging and shareable links.', tech: ['JavaScript', 'Node.js', 'Redis'], team: 1, months: 2 },
    ],
    achievements: [['Winner - College Web Dev Contest 2025', 'First place among 120 participants.'], ['Open-source contributor', 'Merged 6 pull requests into popular React libraries.']],
    experiences: [{ title: 'Frontend Intern', company: 'Brightwave Solutions', description: 'Built reusable React components and improved Lighthouse performance score from 62 to 91.', start: 240, end: 180 }],
  },
  {
    email: 'priya.nair@skillbridge.demo', name: 'Priya Nair', username: 'priya-nair', inst: 0,
    degree: 'B.Tech Information Science', branch: 'ISE', year: 2026, location: 'Kochi, KL',
    headline: 'Data-minded engineer exploring applied machine learning',
    bio: 'I enjoy turning messy data into decisions. Built forecasting dashboards and a crop-disease classifier; looking for data and ML internships.',
    interests: ['Data', 'Machine Learning', 'AI'], github: 'https://github.com/priya-nair-ml', linkedin: 'https://linkedin.com/in/priya-nair-ml',
    skills: [['Python', 92], ['Machine Learning', 78], ['Pandas', 85], ['TensorFlow', 65], ['SQL', 80], ['Data Visualization', 75], ['Git', 70], ['Communication', 78]],
    credentials: [
      { type: 'CERTIFICATION', title: 'Machine Learning Specialization', issuer: 'Coursera / DeepLearning.AI', days: 170, status: 'VERIFIED', skills: ['Machine Learning', 'Python'] },
      { type: 'CERTIFICATION', title: 'TensorFlow Developer Certificate', issuer: 'Google', days: 80, status: 'VERIFIED', skills: ['TensorFlow'] },
      { type: 'CERTIFICATION', title: 'SQL for Data Analysis', issuer: 'Udacity', days: 120, status: 'VERIFIED', skills: ['SQL', 'Pandas'] },
      { type: 'HACKATHON', title: 'Kaggle India Datathon - Top 10', issuer: 'Kaggle', days: 40, status: 'PENDING', skills: ['Data Visualization'] },
    ],
    projects: [
      { title: 'CropGuard', description: 'CNN-based leaf-disease classifier reaching 94% accuracy, packaged behind a simple Flask API for farmers.', tech: ['Python', 'TensorFlow', 'Machine Learning'], team: 3, months: 4 },
      { title: 'Sales Forecast Dashboard', description: 'Time-series forecasting of retail sales with interactive dashboards for store managers.', tech: ['Python', 'Pandas', 'Data Visualization', 'SQL'], team: 2, months: 3 },
    ],
    achievements: [['Dean\'s List 2024-25', 'Top 5% of the department by CGPA.']],
    experiences: [{ title: 'Data Analyst Intern', company: 'Quantify Analytics', description: 'Automated weekly reports, saving the team ~6 hours per week.', start: 300, end: 240 }],
  },
  {
    email: 'rohan.mehta@skillbridge.demo', name: 'Rohan Mehta', username: 'rohan-mehta', inst: 0,
    degree: 'B.Tech Computer Science', branch: 'CSE', year: 2026, location: 'Pune, MH',
    headline: 'Backend engineer into cloud and distributed systems',
    bio: 'Backend-focused developer comfortable with Java, Go and AWS. I like designing APIs that stay fast under load.',
    interests: ['Backend', 'Cloud', 'DevOps'], github: 'https://github.com/rohanm-dev', linkedin: 'https://linkedin.com/in/rohan-mehta-dev',
    skills: [['Java', 88], ['Spring Boot', 75], ['PostgreSQL', 78], ['Docker', 72], ['AWS', 68], ['REST APIs', 85], ['Git', 82], ['Data Structures', 90], ['Go', 50]],
    credentials: [
      { type: 'CERTIFICATION', title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', days: 130, status: 'VERIFIED', skills: ['AWS'] },
      { type: 'CERTIFICATION', title: 'Docker Mastery', issuer: 'Udemy', days: 100, status: 'VERIFIED', skills: ['Docker'] },
      { type: 'CERTIFICATION', title: 'Spring Boot Microservices', issuer: 'Infosys Springboard', days: 70, status: 'VERIFIED', skills: ['Spring Boot', 'Java'] },
      { type: 'ACHIEVEMENT', title: 'ICPC Regionals - Rank 38', issuer: 'ACM ICPC', days: 200, status: 'VERIFIED', skills: ['Data Structures'] },
      { type: 'WORKSHOP', title: 'Kubernetes for Developers', issuer: 'CNCF Bengaluru', days: 8, status: 'PENDING', skills: ['Kubernetes'] },
    ],
    projects: [
      { title: 'QuickShort', description: 'High-throughput URL shortener with analytics, rate limiting and Redis caching handling 2k requests per second in load tests.', tech: ['Java', 'Spring Boot', 'Redis', 'Docker'], team: 1, months: 3 },
      { title: 'LedgerLite', description: 'Double-entry bookkeeping microservice with audit trails and idempotent payment APIs.', tech: ['Spring Boot', 'PostgreSQL', 'AWS'], team: 2, months: 4 },
    ],
    achievements: [['ICPC Regionals Rank 38', 'Team of three, among 400+ teams.']],
    experiences: [{ title: 'Backend Intern', company: 'PayNest', description: 'Built internal reconciliation APIs with Spring Boot.', start: 280, end: 220 }],
  },
  {
    email: 'ananya.iyer@skillbridge.demo', name: 'Ananya Iyer', username: 'ananya-iyer', inst: 0,
    degree: 'B.Des Interaction Design', branch: 'Design', year: 2027, location: 'Chennai, TN',
    headline: 'Product designer who also codes her prototypes',
    bio: 'I design and build interfaces end to end: research, Figma prototypes and front-end implementation in React.',
    interests: ['Design', 'Frontend', 'UX'], github: 'https://github.com/ananya-iyer', linkedin: 'https://linkedin.com/in/ananya-iyer-design',
    skills: [['Figma', 90], ['HTML/CSS', 85], ['React', 62], ['JavaScript', 65], ['Tailwind CSS', 70], ['Communication', 88], ['Leadership', 70]],
    credentials: [
      { type: 'CERTIFICATION', title: 'Google UX Design Professional Certificate', issuer: 'Coursera / Google', days: 140, status: 'VERIFIED', skills: ['Figma'] },
      { type: 'CERTIFICATION', title: 'Responsive Web Design', issuer: 'freeCodeCamp', days: 90, status: 'VERIFIED', skills: ['HTML/CSS'] },
      { type: 'ACHIEVEMENT', title: 'Best Design - Hack the Campus', issuer: 'Sahyadri Hackathon Cell', days: 35, status: 'PENDING', skills: ['Figma'] },
    ],
    projects: [
      { title: 'Saathi Health App', description: 'Mobile-first medicine reminder concept for elderly users, tested with 15 participants and iterated over 3 rounds.', tech: ['Figma', 'React', 'Tailwind CSS'], team: 3, months: 3 },
    ],
    achievements: [['Design Club Lead', 'Organised 4 workshops for 200+ students.']],
    experiences: [],
  },
  {
    email: 'kabir.singh@skillbridge.demo', name: 'Kabir Singh', username: 'kabir-singh', inst: 0,
    degree: 'B.Tech Electronics & Computer', branch: 'ECE', year: 2025, location: 'Chandigarh, PB',
    headline: 'DevOps enthusiast automating everything',
    bio: 'I build CI/CD pipelines and containerised deployments. Currently exploring Kubernetes and infrastructure-as-code.',
    interests: ['DevOps', 'Cloud', 'Linux'], github: 'https://github.com/kabir-ops', linkedin: null,
    skills: [['Linux', 85], ['Docker', 80], ['CI/CD', 75], ['AWS', 70], ['Python', 65], ['Git', 88], ['Kubernetes', 55]],
    credentials: [
      { type: 'CERTIFICATION', title: 'Red Hat Certified System Administrator', issuer: 'Red Hat', days: 160, status: 'VERIFIED', skills: ['Linux'] },
      { type: 'CERTIFICATION', title: 'GitHub Actions CI/CD', issuer: 'GitHub', days: 75, status: 'VERIFIED', skills: ['CI/CD', 'Git'] },
      { type: 'CERTIFICATION', title: 'Certified Kubernetes Application Developer', issuer: 'CNCF', days: 20, status: 'REJECTED', skills: ['Kubernetes'], reason: 'Credential ID could not be verified with the issuer. Please resubmit with a valid certificate link.' },
    ],
    projects: [
      { title: 'DeployBot', description: 'Slack bot that triggers blue/green deployments and rollbacks via GitHub Actions.', tech: ['Python', 'Docker', 'CI/CD', 'AWS'], team: 2, months: 2 },
    ],
    achievements: [],
    experiences: [{ title: 'DevOps Intern', company: 'Stackline Systems', description: 'Containerised 5 legacy services and cut deploy time from 40 to 8 minutes.', start: 330, end: 270 }],
  },
  {
    email: 'sneha.reddy@skillbridge.demo', name: 'Sneha Reddy', username: 'sneha-reddy', inst: 0,
    degree: 'B.Tech Computer Science', branch: 'CSE', year: 2026, location: 'Hyderabad, TS',
    headline: 'Full-stack developer, TypeScript first',
    bio: 'I build type-safe full-stack apps with Next.js and Node. Interested in developer tooling and performance.',
    interests: ['Full Stack', 'TypeScript', 'Web'], github: 'https://github.com/sneha-reddy-dev', linkedin: 'https://linkedin.com/in/sneha-reddy-dev',
    skills: [['TypeScript', 82], ['Next.js', 78], ['React', 84], ['Node.js', 74], ['PostgreSQL', 70], ['Tailwind CSS', 80], ['Git', 78], ['JavaScript', 86], ['Problem Solving', 82]],
    credentials: [
      { type: 'CERTIFICATION', title: 'TypeScript Fundamentals', issuer: 'Frontend Masters', days: 120, status: 'VERIFIED', skills: ['TypeScript'] },
      { type: 'CERTIFICATION', title: 'Next.js App Router Bootcamp', issuer: 'Udemy', days: 85, status: 'VERIFIED', skills: ['Next.js', 'React'] },
      { type: 'HACKATHON', title: 'HackWithInfy - Round 2 Qualifier', issuer: 'Infosys', days: 50, status: 'VERIFIED', skills: ['Problem Solving'] },
      { type: 'CERTIFICATION', title: 'PostgreSQL Performance Tuning', issuer: 'EDB', days: 6, status: 'PENDING', skills: ['PostgreSQL'] },
    ],
    projects: [
      { title: 'DevPulse', description: 'Developer productivity dashboard aggregating GitHub, LeetCode and calendar activity into weekly reports.', tech: ['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'], team: 2, months: 4 },
      { title: 'TypeForm Lite', description: 'Drag-and-drop form builder with conditional logic and CSV export.', tech: ['React', 'TypeScript', 'Node.js'], team: 1, months: 3 },
    ],
    achievements: [['HackWithInfy Round 2', 'Top 2% among 60,000 participants.']],
    experiences: [{ title: 'SDE Intern', company: 'Zenith Commerce', description: 'Shipped a checkout redesign that improved conversion by 7%.', start: 270, end: 210 }],
  },
  {
    email: 'vikram.patel@skillbridge.demo', name: 'Vikram Patel', username: 'vikram-patel', inst: 1,
    degree: 'B.Tech Computer Science', branch: 'CSE', year: 2026, location: 'Ahmedabad, GJ',
    headline: 'Problem solver: DSA, C++ and competitive programming',
    bio: 'Competitive programmer with a 1850 Codeforces rating. Enjoy solving hard algorithmic problems and building fast systems.',
    interests: ['Backend', 'Algorithms', 'Systems'], github: 'https://github.com/vikram-cp', linkedin: 'https://linkedin.com/in/vikram-patel-cp',
    skills: [['C++', 92], ['Data Structures', 95], ['Java', 70], ['Python', 72], ['SQL', 65], ['Git', 75], ['Problem Solving', 92]],
    credentials: [
      { type: 'ACHIEVEMENT', title: 'Codeforces Expert (1850)', issuer: 'Codeforces', days: 90, status: 'VERIFIED', skills: ['Data Structures', 'C++'] },
      { type: 'HACKATHON', title: 'Google Code Jam Round 2', issuer: 'Google', days: 160, status: 'VERIFIED', skills: ['Problem Solving'] },
      { type: 'CERTIFICATION', title: 'Algorithms Specialization', issuer: 'Stanford / Coursera', days: 30, status: 'PENDING', skills: ['Data Structures'] },
    ],
    projects: [
      { title: 'JudgeX', description: 'Sandboxed online judge supporting C++, Java and Python submissions with real-time verdicts.', tech: ['C++', 'Docker', 'Python'], team: 3, months: 5 },
    ],
    achievements: [['Codeforces Expert', 'Reached 1850 rating in 14 months.']],
    experiences: [],
  },
  {
    email: 'ishita.gupta@skillbridge.demo', name: 'Ishita Gupta', username: 'ishita-gupta', inst: 1,
    degree: 'B.Tech Information Technology', branch: 'IT', year: 2026, location: 'New Delhi, DL',
    headline: 'Web developer with a knack for polished UIs',
    bio: 'Frontend-leaning developer who loves animation, accessibility and design systems.',
    interests: ['Frontend', 'Design Systems', 'Web'], github: 'https://github.com/ishita-g-dev', linkedin: 'https://linkedin.com/in/ishita-gupta-dev',
    skills: [['React', 80], ['JavaScript', 84], ['HTML/CSS', 92], ['Tailwind CSS', 85], ['Figma', 68], ['Git', 72], ['TypeScript', 55], ['Communication', 82]],
    credentials: [
      { type: 'CERTIFICATION', title: 'React - The Complete Guide', issuer: 'Udemy', days: 100, status: 'VERIFIED', skills: ['React', 'JavaScript'] },
      { type: 'CERTIFICATION', title: 'Advanced CSS & Sass', issuer: 'Udemy', days: 70, status: 'VERIFIED', skills: ['HTML/CSS', 'Tailwind CSS'] },
      { type: 'WORKSHOP', title: 'Web Accessibility Workshop', issuer: 'Google Developer Group Delhi', days: 14, status: 'PENDING', skills: ['HTML/CSS'] },
    ],
    projects: [
      { title: 'Aurora UI Kit', description: 'Open-source React component library with 30+ accessible components and Storybook docs.', tech: ['React', 'Tailwind CSS', 'TypeScript'], team: 1, months: 4 },
      { title: 'FoodieMap', description: 'Local food discovery app with map-based search, reviews and offline caching.', tech: ['React', 'JavaScript', 'Node.js'], team: 3, months: 3 },
    ],
    achievements: [['Open-source contributor', 'Library downloaded 1,200+ times.']],
    experiences: [{ title: 'UI Developer Intern', company: 'PixelForge Studio', description: 'Translated Figma designs into responsive React components.', start: 250, end: 190 }],
  },
  {
    email: 'arjun.verma@skillbridge.demo', name: 'Arjun Verma', username: 'arjun-verma', inst: 1,
    degree: 'B.Tech Data Science', branch: 'DS', year: 2027, location: 'Jaipur, RJ',
    headline: 'Aspiring ML engineer | Python | Pandas | Deep Learning',
    bio: 'Second-year data science student building small ML projects and learning MLOps.',
    interests: ['Machine Learning', 'Data', 'AI'], github: 'https://github.com/arjun-verma-ds', linkedin: null,
    skills: [['Python', 78], ['Pandas', 70], ['Machine Learning', 60], ['SQL', 58], ['Git', 60]],
    credentials: [
      { type: 'CERTIFICATION', title: 'Python for Everybody', issuer: 'Coursera / University of Michigan', days: 110, status: 'VERIFIED', skills: ['Python'] },
      { type: 'CERTIFICATION', title: 'Intro to Machine Learning', issuer: 'Kaggle', days: 25, status: 'PENDING', skills: ['Machine Learning'] },
    ],
    projects: [
      { title: 'MovieMatch', description: 'Content-based movie recommender using TF-IDF and cosine similarity with a simple Streamlit front-end.', tech: ['Python', 'Pandas', 'Machine Learning'], team: 1, months: 2 },
    ],
    achievements: [],
    experiences: [],
  },
];

// ---------- Opportunities ----------
const OPPORTUNITIES = [
  { emp: 0, title: 'Frontend Developer Intern', type: 'INTERNSHIP', loc: 'Bengaluru', mode: 'HYBRID', exp: 0, dl: 21, pay: '₹25,000/month', skills: ['React', 'JavaScript', 'HTML/CSS', 'Git', 'TypeScript'], views: 142, desc: 'Join the Nimbus Labs console team and build accessible React interfaces used by thousands of developers. You will pair with senior engineers, ship production features and learn our design system.' },
  { emp: 0, title: 'Full Stack Developer', type: 'JOB', loc: 'Bengaluru', mode: 'HYBRID', exp: 1, dl: 35, pay: '₹9-12 LPA', skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker'], views: 98, desc: 'Own features end to end across our React front-end and Node.js services. You will design APIs, write migrations and deploy via CI/CD. Freshers with strong projects are welcome.' },
  { emp: 0, title: 'Cloud Engineer Intern', type: 'INTERNSHIP', loc: 'Remote', mode: 'REMOTE', exp: 0, dl: 28, pay: '₹30,000/month', skills: ['AWS', 'Docker', 'Linux', 'CI/CD', 'Python'], views: 76, desc: 'Help the platform team automate infrastructure, improve observability and harden deployments on AWS. A great first step into cloud engineering.' },
  { emp: 1, title: 'React Developer Intern', type: 'INTERNSHIP', loc: 'Gurugram', mode: 'ONSITE', exp: 0, dl: 18, pay: '₹20,000/month', skills: ['React', 'JavaScript', 'Tailwind CSS', 'Git'], views: 181, desc: 'Build storefront components for CloudKart, one of the fastest-growing e-commerce platforms. You will work on performance, A/B tests and checkout flows.' },
  { emp: 1, title: 'Backend Engineer (Java)', type: 'JOB', loc: 'Gurugram', mode: 'ONSITE', exp: 1, dl: 40, pay: '₹10-14 LPA', skills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST APIs', 'Docker'], views: 67, desc: 'Design and scale order, inventory and payment services handling millions of requests a day. Strong fundamentals in data structures and databases expected.' },
  { emp: 1, title: 'UI/UX Design Intern', type: 'INTERNSHIP', loc: 'Remote', mode: 'REMOTE', exp: 0, dl: 25, pay: '₹18,000/month', skills: ['Figma', 'HTML/CSS', 'Communication'], views: 89, desc: 'Work with product managers to design customer journeys, prototype in Figma and run quick usability tests.' },
  { emp: 2, title: 'Data Science Intern', type: 'INTERNSHIP', loc: 'Mumbai', mode: 'HYBRID', exp: 0, dl: 30, pay: '₹28,000/month', skills: ['Python', 'Machine Learning', 'Pandas', 'SQL'], views: 120, desc: 'Build credit-risk and fraud-detection models with FinEdge data scientists. You will clean data, run experiments and present findings to stakeholders.' },
  { emp: 2, title: 'ML Engineer', type: 'JOB', loc: 'Mumbai', mode: 'HYBRID', exp: 2, dl: 45, pay: '₹14-18 LPA', skills: ['Python', 'Machine Learning', 'TensorFlow', 'Docker', 'AWS'], views: 54, desc: 'Take models from notebook to production: feature pipelines, model serving and monitoring on AWS. Some prior project or internship experience required.' },
  { emp: 2, title: 'FinEdge CodeSprint 2026', type: 'HACKATHON', loc: 'Mumbai', mode: 'ONSITE', exp: 0, dl: 14, pay: '₹2,00,000 prize pool', skills: ['Problem Solving', 'Python', 'REST APIs'], views: 210, desc: '36-hour fintech hackathon. Build a product that makes payments safer or credit more inclusive. Teams of 2-4. Mentorship from FinEdge engineers.' },
  { emp: 0, title: 'Nimbus Open Source Scholarship', type: 'SCHOLARSHIP', loc: 'Remote', mode: 'REMOTE', exp: 0, dl: 50, pay: '₹50,000 stipend', skills: ['Git', 'JavaScript', 'Communication'], views: 73, desc: 'A three-month scholarship for students contributing to open-source projects, with a dedicated mentor from the Nimbus Labs engineering team.' },
  { emp: 1, title: 'CloudKart Algorithm Challenge', type: 'COMPETITION', loc: 'Remote', mode: 'REMOTE', exp: 0, dl: 16, pay: '₹1,00,000 prize', skills: ['Data Structures', 'C++', 'Problem Solving'], views: 134, desc: 'Online competitive programming contest with rounds on graph algorithms, dynamic programming and system optimisation. Top 10 get interview fast-track.' },
  { emp: 2, title: 'Kubernetes in Production Workshop', type: 'WORKSHOP', loc: 'Bengaluru', mode: 'ONSITE', exp: 0, dl: 12, pay: 'Free', skills: ['Kubernetes', 'Docker', 'Linux'], views: 45, desc: 'A hands-on one-day workshop covering deployments, autoscaling and debugging on Kubernetes, led by FinEdge platform engineers.' },
  { emp: 0, title: 'DevOps Engineer', type: 'JOB', loc: 'Pune', mode: 'ONSITE', exp: 1, dl: 33, pay: '₹8-11 LPA', skills: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS'], views: 38, desc: 'Run and improve our CI/CD pipelines and Kubernetes clusters. You will be on a rotating support schedule and help teams ship safely.' },
];

// [studentUsername, opportunityTitle, status, daysAgo]
const APPLICATIONS = [
  ['rohan-mehta', 'Backend Engineer (Java)', 'INTERVIEW', 12],
  ['rohan-mehta', 'Cloud Engineer Intern', 'SHORTLISTED', 9],
  ['priya-nair', 'Data Science Intern', 'SELECTED', 25],
  ['priya-nair', 'ML Engineer', 'UNDER_REVIEW', 6],
  ['sneha-reddy', 'Full Stack Developer', 'INTERVIEW', 10],
  ['sneha-reddy', 'Frontend Developer Intern', 'SELECTED', 30],
  ['ishita-gupta', 'React Developer Intern', 'SHORTLISTED', 7],
  ['ishita-gupta', 'Frontend Developer Intern', 'APPLIED', 3],
  ['kabir-singh', 'Cloud Engineer Intern', 'UNDER_REVIEW', 8],
  ['kabir-singh', 'DevOps Engineer', 'REJECTED', 18],
  ['vikram-patel', 'CloudKart Algorithm Challenge', 'SELECTED', 14],
  ['vikram-patel', 'Backend Engineer (Java)', 'UNDER_REVIEW', 5],
  ['ananya-iyer', 'UI/UX Design Intern', 'SHORTLISTED', 4],
  ['arjun-verma', 'Data Science Intern', 'APPLIED', 2],
  ['aarav-sharma', 'React Developer Intern', 'UNDER_REVIEW', 4],
  ['aarav-sharma', 'FinEdge CodeSprint 2026', 'APPLIED', 2],
];

const SAVED = [
  ['aarav-sharma', 'Full Stack Developer'],
  ['aarav-sharma', 'Nimbus Open Source Scholarship'],
  ['aarav-sharma', 'CloudKart Algorithm Challenge'],
  ['priya-nair', 'Data Science Intern'],
];

async function main() {
  console.log('Clearing existing data...');
  for (const model of [
    'notification', 'savedOpportunity', 'application', 'opportunitySkill', 'opportunity',
    'credentialVerification', 'studentSkill', 'credential', 'achievement', 'experience', 'project',
    'studentProfile', 'employer', 'institution', 'skill', 'user',
  ]) {
    await prisma[model].deleteMany();
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Skills
  const skillByName = {};
  for (const [category, names] of Object.entries(SKILLS)) {
    for (const name of names) skillByName[name] = await prisma.skill.create({ data: { name, category } });
  }
  for (const name of SOFT) skillByName[name] = await prisma.skill.create({ data: { name, category: 'Soft Skills', kind: 'SOFT' } });

  // Institutions
  const institutions = [];
  for (const i of INSTITUTIONS) {
    const user = await prisma.user.create({
      data: { email: i.email, passwordHash, role: 'INSTITUTION', name: i.name, institution: { create: { name: i.name, city: i.city, domain: i.domain } } },
      include: { institution: true },
    });
    institutions.push(user);
  }

  // Employers
  const employers = [];
  for (const e of EMPLOYERS) {
    const user = await prisma.user.create({
      data: { email: e.email, passwordHash, role: 'EMPLOYER', name: e.recruiter, employer: { create: { companyName: e.company, recruiter: e.recruiter, industry: e.industry, website: e.website } } },
      include: { employer: true },
    });
    employers.push(user);
  }

  // Students
  const profiles = {};
  let credCount = 0;
  for (const s of STUDENTS) {
    const inst = institutions[s.inst];
    const user = await prisma.user.create({
      data: {
        email: s.email, passwordHash, role: 'STUDENT', name: s.name,
        student: {
          create: {
            username: s.username, institutionId: inst.institution.id, collegeName: inst.institution.name,
            degree: s.degree, branch: s.branch, graduationYear: s.year, headline: s.headline, bio: s.bio,
            location: s.location, interests: s.interests, githubUrl: s.github, linkedinUrl: s.linkedin,
          },
        },
      },
      include: { student: true },
    });
    const profile = user.student;
    profiles[s.username] = profile;

    // Credentials + verification audit trail
    const credByIndex = [];
    for (const c of s.credentials) {
      const submitted = daysAgo(c.days);
      const cred = await prisma.credential.create({
        data: {
          studentId: profile.id, type: c.type, title: c.title, issuer: c.issuer, issuedOn: daysAgo(c.days + 10),
          credentialId: `${c.issuer.split(/[ /]/)[0].slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
          description: null, status: c.status, rejectionReason: c.reason ?? null, createdAt: submitted,
        },
      });
      credCount += 1;
      credByIndex.push(cred);
      await prisma.credentialVerification.create({
        data: { credentialId: cred.id, decision: 'PENDING', note: 'Submitted for verification', createdAt: submitted },
      });
      if (c.status !== 'PENDING') {
        await prisma.credentialVerification.create({
          data: {
            credentialId: cred.id, verifierId: inst.id, decision: c.status,
            note: c.status === 'REJECTED' ? c.reason : 'Certificate checked against issuer records',
            createdAt: new Date(submitted.getTime() + 2 * 86400000),
          },
        });
      }
    }

    // Skills: verification flows from the credential that backs them
    const backing = new Map(); // skill name -> credential
    s.credentials.forEach((c, idx) => c.skills.forEach((n) => { if (!backing.has(n) || c.status === 'VERIFIED') backing.set(n, { cred: credByIndex[idx], status: c.status }); }));
    const owned = new Set(s.skills.map(([n]) => n));
    const allSkills = [...s.skills];
    // Skills that only appear on credentials (e.g. a pending AWS cert) are still listed as self-reported.
    for (const [n] of backing) if (!owned.has(n) && skillByName[n]) allSkills.push([n, 40]);
    for (const [name, proficiency] of allSkills) {
      const b = backing.get(name);
      const verified = b && b.status === 'VERIFIED';
      await prisma.studentSkill.create({
        data: {
          studentId: profile.id, skillId: skillByName[name].id, proficiency,
          status: verified ? 'VERIFIED' : 'PENDING', verifiedAt: verified ? daysAgo(1) : null,
          credentialId: b && b.status !== 'REJECTED' ? b.cred.id : null,
          evidence: b ? `Backed by: ${b.cred.title}` : null,
        },
      });
    }

    let offset = 0;
    for (const p of s.projects) {
      offset += 1;
      await prisma.project.create({
        data: {
          studentId: profile.id, title: p.title, description: p.description, technologies: p.tech, teamSize: p.team,
          githubUrl: `https://github.com/${s.username}/${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          liveUrl: offset === 1 ? `https://${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example.app` : null,
          startDate: daysAgo(30 * (p.months + 2) * offset), endDate: daysAgo(30 * 2 * offset),
        },
      });
    }
    for (const [title, description] of s.achievements) {
      await prisma.achievement.create({ data: { studentId: profile.id, title, description, date: daysAgo(90) } });
    }
    for (const e of s.experiences) {
      await prisma.experience.create({
        data: { studentId: profile.id, title: e.title, company: e.company, description: e.description, startDate: daysAgo(e.start), endDate: daysAgo(e.end) },
      });
    }
  }

  // Opportunities
  const oppByTitle = {};
  for (const o of OPPORTUNITIES) {
    const employer = employers[o.emp].employer;
    oppByTitle[o.title] = await prisma.opportunity.create({
      data: {
        employerId: employer.id, title: o.title, organization: employer.companyName, description: o.desc, type: o.type,
        location: o.loc, workMode: o.mode, minExperience: o.exp, deadline: daysAhead(o.dl), compensation: o.pay,
        applicationUrl: `${EMPLOYERS[o.emp].website}/careers`, views: o.views, postedAt: daysAgo(Math.floor(Math.random() * 20) + 1),
        skills: { create: o.skills.map((n) => ({ skillId: skillByName[n].id })) },
      },
    });
  }

  // Applications (match score is computed by the engine at apply time in the app; seeded from the same engine)
  const { computeMatch } = require('../src/services/matching');
  for (const [username, title, status, days] of APPLICATIONS) {
    const profile = profiles[username];
    const full = await prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: { skills: { include: { skill: true } }, projects: true, experiences: true },
    });
    const opp = await prisma.opportunity.findUnique({ where: { id: oppByTitle[title].id }, include: { skills: { include: { skill: true } } } });
    const { score } = computeMatch(full, opp);
    await prisma.application.create({
      data: { studentId: profile.id, opportunityId: opp.id, status, matchScore: score, createdAt: daysAgo(days), updatedAt: daysAgo(Math.max(0, days - 2)) },
    });
    if (status === 'SELECTED') {
      await prisma.studentProfile.update({ where: { id: profile.id }, data: { placed: true, placedAt: opp.organization } });
    }
  }

  for (const [username, title] of SAVED) {
    await prisma.savedOpportunity.create({ data: { studentId: profiles[username].id, opportunityId: oppByTitle[title].id } });
  }

  // A few notifications for the demo student / institution / employer
  const aarav = await prisma.user.findUnique({ where: { email: 'student@skillbridge.demo' } });
  await prisma.notification.createMany({
    data: [
      { userId: aarav.id, title: 'Credential verified', body: '"Meta Front-End Developer Professional Certificate" was verified by Sahyadri Institute of Technology.', link: '/student/credentials' },
      { userId: aarav.id, title: 'Application update', body: 'Your application for React Developer Intern is now: Under review.', link: '/student/applications' },
      { userId: institutions[0].id, title: 'New credential to verify', body: 'Aarav Sharma submitted "AWS Cloud Practitioner".', link: '/institution/verification' },
      { userId: employers[0].id, title: 'New application', body: 'Ishita Gupta applied to Frontend Developer Intern.', link: '/employer/applications' },
    ],
  });

  const counts = {
    users: await prisma.user.count(), skills: await prisma.skill.count(), credentials: credCount,
    projects: await prisma.project.count(), opportunities: await prisma.opportunity.count(),
    applications: await prisma.application.count(),
  };
  console.log('Seeded:', counts);
  console.log(`\nDemo logins (password: ${DEMO_PASSWORD})`);
  console.log('  Student      student@skillbridge.demo');
  console.log('  Institution  institution@skillbridge.demo');
  console.log('  Employer     employer@skillbridge.demo');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
