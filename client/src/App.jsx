import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireRole } from './components/RouteGuards';
import { PageLoader } from './components/ui';
import AppLayout from './layouts/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Role areas are code-split so each visitor only downloads what they use (Recharts is the big one).
const page = (loader, name) => lazy(() => loader().then((m) => ({ default: name ? m[name] : m.default })));
const PublicProfile = page(() => import('./pages/PublicProfile'));
const Settings = page(() => import('./pages/Settings'));

const StudentDashboard = page(() => import('./pages/student/Dashboard'));
const Profile = page(() => import('./pages/student/Profile'));
const Skills = page(() => import('./pages/student/Skills'));
const Projects = page(() => import('./pages/student/Projects'));
const Credentials = page(() => import('./pages/student/Credentials'));
const Opportunities = page(() => import('./pages/student/Opportunities'));
const OpportunityDetail = page(() => import('./pages/student/OpportunityDetail'));
const Applications = page(() => import('./pages/student/Applications'));
const StudentAnalytics = page(() => import('./pages/student/Analytics'));

const InstitutionDashboard = page(() => import('./pages/institution/Dashboard'));
const Verification = page(() => import('./pages/institution/Verification'));
const StudentsList = page(() => import('./pages/institution/Students'), 'StudentsList');
const StudentDetail = page(() => import('./pages/institution/Students'), 'StudentDetail');
const InstitutionAnalytics = page(() => import('./pages/institution/Analytics'));

const EmployerDashboard = page(() => import('./pages/employer/Dashboard'));
const Candidates = page(() => import('./pages/employer/Candidates'), 'Candidates');
const CandidateProfile = page(() => import('./pages/employer/Candidates'), 'CandidateProfile');
const MyOpportunities = page(() => import('./pages/employer/Opportunities'), 'MyOpportunities');
const OpportunityForm = page(() => import('./pages/employer/Opportunities'), 'OpportunityForm');
const EmployerApplications = page(() => import('./pages/employer/Applications'));
const EmployerAnalytics = page(() => import('./pages/employer/Analytics'));

export default function App() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><PageLoader /></div>}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/profile/:username" element={<PublicProfile />} />

      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireRole roles={['STUDENT']} />}>
        <Route path="/student" element={<AppLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="skills" element={<Skills />} />
          <Route path="projects" element={<Projects />} />
          <Route path="credentials" element={<Credentials />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />
          <Route path="applications" element={<Applications />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['INSTITUTION']} />}>
        <Route path="/institution" element={<AppLayout />}>
          <Route index element={<InstitutionDashboard />} />
          <Route path="verification" element={<Verification />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="analytics" element={<InstitutionAnalytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['EMPLOYER']} />}>
        <Route path="/employer" element={<AppLayout />}>
          <Route index element={<EmployerDashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateProfile />} />
          <Route path="opportunities" element={<MyOpportunities />} />
          <Route path="opportunities/new" element={<OpportunityForm />} />
          <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
          <Route path="applications" element={<EmployerApplications />} />
          <Route path="analytics" element={<EmployerAnalytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
