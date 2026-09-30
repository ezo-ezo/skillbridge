import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Building2, Briefcase } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import { Button, Field, Input } from '../../components/ui';
import { useAuth, ROLE_HOME } from '../../context/AuthContext';
import { cn } from '../../utils/format';

const ROLES = [
  { value: 'STUDENT', label: 'Student', icon: GraduationCap, demo: 'student@skillbridge.demo' },
  { value: 'INSTITUTION', label: 'Institution', icon: Building2, demo: 'institution@skillbridge.demo' },
  { value: 'EMPLOYER', label: 'Employer', icon: Briefcase, demo: 'employer@skillbridge.demo' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password, role);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(from && from.startsWith(ROLE_HOME[user.role]) ? from : ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (r) => {
    setRole(r.value);
    setEmail(r.demo);
    setPassword('Demo@1234');
    setError('');
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your SkillBridge account.">
      <div className="mb-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="I am a">
        {ROLES.map((r) => (
          <button
            key={r.value} type="button" role="radio" aria-checked={role === r.value} onClick={() => setRole(r.value)}
            className={cn('flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all',
              role === r.value ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20' : 'border-slate-200 text-slate-500 hover:border-slate-300')}
          >
            <r.icon className="size-5" />{r.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" required>{(id) => <Input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />}</Field>
        <Field label="Password" required>{(id) => <Input id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />}</Field>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">Log in</Button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Demo accounts</p>
        <p className="mt-1 text-xs text-slate-500">Click a role to fill in a seeded account (password <code className="rounded bg-white px-1 font-mono">Demo@1234</code>).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ROLES.map((r) => <button key={r.value} type="button" onClick={() => fillDemo(r)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 hover:ring-brand-400">{r.label}</button>)}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">New to SkillBridge? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></p>
    </AuthLayout>
  );
}
