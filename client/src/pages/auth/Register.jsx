import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Building2, Briefcase } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import { Button, Field, Input, TagInput } from '../../components/ui';
import { useAuth, ROLE_HOME } from '../../context/AuthContext';
import { cn } from '../../utils/format';

const ROLES = [
  { value: 'STUDENT', label: 'Student', icon: GraduationCap },
  { value: 'INSTITUTION', label: 'Institution', icon: Building2 },
  { value: 'EMPLOYER', label: 'Employer', icon: Briefcase },
];
const SKILL_SUGGESTIONS = ['React', 'JavaScript', 'Python', 'Node.js', 'Java', 'SQL', 'Git', 'Docker', 'AWS', 'Machine Learning', 'TypeScript', 'HTML/CSS'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = ROLES.some((r) => r.value === params.get('role')) ? params.get('role') : 'STUDENT';
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({ skills: [], graduationYear: new Date().getFullYear() + 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { role, email: form.email, password: form.password };
      if (role === 'STUDENT') Object.assign(payload, { name: form.name, college: form.college, degree: form.degree, graduationYear: Number(form.graduationYear), skills: form.skills });
      if (role === 'INSTITUTION') payload.institutionName = form.institutionName;
      if (role === 'EMPLOYER') Object.assign(payload, { companyName: form.companyName, recruiterName: form.recruiterName });
      const user = await register(payload);
      toast.success('Account created. Welcome to SkillBridge!');
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const text = (key, label, props = {}) => (
    <Field label={label} required>{(id) => <Input id={id} required value={form[key] ?? ''} onChange={set(key)} {...props} />}</Field>
  );

  return (
    <AuthLayout title="Create your account" subtitle="Join SkillBridge in under a minute.">
      <div className="mb-5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="I am a">
        {ROLES.map((r) => (
          <button key={r.value} type="button" role="radio" aria-checked={role === r.value} onClick={() => setRole(r.value)}
            className={cn('flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all',
              role === r.value ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
            <r.icon className="size-5" />{r.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {role === 'STUDENT' && (<>
          {text('name', 'Full name', { placeholder: 'Aarav Sharma', autoComplete: 'name' })}
          {text('college', 'College', { placeholder: 'Sahyadri Institute of Technology' })}
          <div className="grid grid-cols-[1fr_120px] gap-3">
            {text('degree', 'Degree', { placeholder: 'B.Tech Computer Science' })}
            {text('graduationYear', 'Grad. year', { type: 'number', min: 2015, max: 2040 })}
          </div>
          <Field label="Skills" hint="Press Enter after each skill. You can add proficiency later."><TagInput value={form.skills} onChange={(skills) => setForm((f) => ({ ...f, skills }))} placeholder="e.g. React, Python" suggestions={SKILL_SUGGESTIONS} /></Field>
        </>)}
        {role === 'INSTITUTION' && text('institutionName', 'Institution name', { placeholder: 'Sahyadri Institute of Technology' })}
        {role === 'EMPLOYER' && (<>
          {text('companyName', 'Company name', { placeholder: 'Nimbus Labs' })}
          {text('recruiterName', 'Recruiter name', { placeholder: 'Meera Krishnan' })}
        </>)}
        {text('email', role === 'INSTITUTION' ? 'Official email' : 'Email', { type: 'email', autoComplete: 'email' })}
        <Field label="Password" required hint="At least 8 characters.">{(id) => <Input id={id} type="password" autoComplete="new-password" required minLength={8} value={form.password ?? ''} onChange={set('password')} />}</Field>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert">{error}</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></p>
    </AuthLayout>
  );
}
