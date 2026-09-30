import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, BarChart3, Briefcase, Building2, CheckCircle2, ChevronRight, FileWarning, GraduationCap,
  Hammer, Link2, Menu, Search, ShieldCheck, Sparkles, Target, Users, X, FolderX, Layers,
} from 'lucide-react';
import Logo from '../components/Logo';
import { Button } from '../components/ui';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { api } from '../services/api';
import { cn } from '../utils/format';

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.5 } };

const PIPELINE = [
  { icon: Hammer, label: 'BUILD', text: 'Add projects, skills and credentials to one portfolio.' },
  { icon: BadgeCheck, label: 'VERIFY', text: 'Your institution verifies what is real.' },
  { icon: Target, label: 'MATCH', text: 'Verified skills power opportunity matching.' },
  { icon: Link2, label: 'CONNECT', text: 'Apply, get discovered and get hired.' },
];

const PROBLEMS = [
  { icon: FolderX, title: 'Scattered proof', text: 'Certificates sit in folders, projects on GitHub, achievements in old emails. No single place tells your story.' },
  { icon: FileWarning, title: 'Claims nobody can trust', text: 'Anyone can write "expert in React" on a resume. Recruiters have no quick way to tell which skills are real.' },
  { icon: Layers, title: 'Opportunities missed', text: 'Students scroll through hundreds of listings that do not fit, while the right internship goes unseen.' },
];

const FEATURES = [
  { icon: BadgeCheck, title: 'Verified credentials', text: 'Institutions approve or reject submissions with a full audit trail. Verified items carry a clear badge.' },
  { icon: Sparkles, title: 'Living skill portfolio', text: 'Verified and self-reported skills are shown separately, with proficiency and evidence.' },
  { icon: Target, title: 'Skill-based matching', text: 'Every opportunity gets a match % with exactly which skills you have and which are missing.' },
  { icon: Search, title: 'Verified talent search', text: 'Employers filter candidates by verified skills, college, degree and experience.' },
  { icon: BarChart3, title: 'Analytics for everyone', text: 'Profile strength, skill distribution, placement outcomes and hiring pipelines in live dashboards.' },
  { icon: ShieldCheck, title: 'Secure by design', text: 'JWT authentication, hashed passwords, role-based access and private-by-default data.' },
];

const WORKFLOWS = [
  { role: 'Students', icon: GraduationCap, color: 'from-blue-500 to-cyan-400', steps: ['Create your portfolio and add skills', 'Submit certificates for verification', 'See matches ranked by your verified skills', 'Apply and track every application'] },
  { role: 'Institutions', icon: Building2, color: 'from-violet-500 to-fuchsia-400', steps: ['Review pending credential requests', 'Verify or reject with a reason', 'Track skill development by cohort', 'Measure placement outcomes'] },
  { role: 'Employers', icon: Briefcase, color: 'from-indigo-500 to-blue-400', steps: ['Post internships, jobs and hackathons', 'Search candidates by verified skills', 'Open full verified profiles', 'Move applicants through your pipeline'] },
];

const QUOTES = [
  { quote: 'My AWS and React certificates finally live in one verified profile. Recruiters stopped asking for PDFs.', name: 'Aarav S.', role: 'Student persona' },
  { quote: 'Verification takes one click and leaves an audit trail. We can see which skills our cohort is actually building.', name: 'Placement cell', role: 'Institution persona' },
  { quote: 'Filtering by verified skills cut our screening time drastically. The match breakdown is what sold the team.', name: 'Meera K.', role: 'Employer persona' },
];

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{value ?? '–'}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function PipelineVisual() {
  return (
    <div className="relative mx-auto mt-14 max-w-4xl">
      <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent md:block" />
      <div className="relative grid gap-4 md:grid-cols-4">
        {PIPELINE.map(({ icon: Icon, label, text }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }} className="glass relative rounded-2xl p-4 text-left">
            <span className="mb-3 grid size-12 place-items-center rounded-xl bg-brand-gradient shadow-lg shadow-brand-600/30"><Icon className="size-6 text-white" /></span>
            <p className="text-xs font-bold tracking-[0.2em] text-brand-400">0{i + 1} · {label}</p>
            <p className="mt-1.5 text-sm text-slate-300">{text}</p>
            {i < 3 && <ChevronRight className="absolute -right-4 top-7 z-10 hidden size-5 text-brand-400 md:block" />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MatchPreview() {
  const skills = [['React', true], ['JavaScript', true], ['HTML/CSS', true], ['Git', true], ['TypeScript', false]];
  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl bg-white p-5 text-left shadow-2xl shadow-brand-900/30 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">92% MATCH</span>
          <h3 className="mt-2.5 text-lg font-bold text-slate-900">Frontend Developer Intern</h3>
          <p className="text-sm text-slate-500">Nimbus Labs · Bengaluru · Hybrid</p>
        </div>
        <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">Internship</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" /></div>
      <ul className="mt-4 space-y-2">
        {skills.map(([s, ok]) => (
          <li key={s} className="flex items-center justify-between text-sm">
            <span className={ok ? 'text-slate-800' : 'text-slate-400'}>{s}</span>
            {ok ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="size-4" /> Verified</span> : <span className="text-xs font-medium text-amber-600">Missing</span>}
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><strong>Why this matches you:</strong> you match 4 of 5 required skills, all verified by your institution.</p>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => { api.get('/stats/public').then(setStats).catch(() => {}); }, []);

  const cta = user ? { to: ROLE_HOME[user.role], label: 'Open dashboard' } : { to: '/register', label: 'Get Started' };
  const scrollTo = (id) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="bg-white text-slate-900">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-navy-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Logo dark />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            {[['how', 'How it works'], ['features', 'Features'], ['workflows', 'Who it’s for'], ['stats', 'Impact']].map(([id, l]) => <button key={id} onClick={() => scrollTo(id)} className="hover:text-white">{l}</button>)}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {!user && <Link to="/login" className="text-sm font-semibold text-slate-200 hover:text-white">Log in</Link>}
            <Link to={cta.to}><Button size="sm">{cta.label}</Button></Link>
          </div>
          <button className="text-white md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">{menu ? <X /> : <Menu />}</button>
        </div>
        {menu && (
          <div className="space-y-1 border-t border-white/10 bg-navy-950 px-5 py-4 md:hidden">
            {[['how', 'How it works'], ['features', 'Features'], ['workflows', 'Who it’s for']].map(([id, l]) => <button key={id} onClick={() => scrollTo(id)} className="block w-full py-2 text-left text-slate-300">{l}</button>)}
            <div className="flex gap-3 pt-2">{!user && <Link to="/login" className="flex-1"><Button variant="dark" className="w-full">Log in</Button></Link>}<Link to={cta.to} className="flex-1"><Button className="w-full">{cta.label}</Button></Link></div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 pb-24 pt-32 text-white sm:pt-40">
        <div className="grid-bg absolute inset-0" />
        <div className="absolute -left-32 top-10 size-[28rem] rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="absolute -right-24 top-40 size-[26rem] rounded-full bg-violet-brand/30 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-5">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="text-center lg:text-left">
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-200">
                <BadgeCheck className="size-4 text-brand-400" /> Trusted skill portfolios for the next generation
              </motion.span>
              <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
                Turn <span className="text-brand-gradient">Verified Skills</span> Into Real Opportunities.
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto mt-6 max-w-xl text-lg text-slate-300 lg:mx-0">
                SkillBridge connects students, institutions and employers through trusted skill portfolios and intelligent opportunity matching.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link to={cta.to}><Button size="lg" icon={ArrowRight}>{cta.label}</Button></Link>
                <Button size="lg" variant="dark" onClick={() => scrollTo('how')}>Explore Platform</Button>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, duration: 0.6 }}><MatchPreview /></motion.div>
          </div>
          <PipelineVisual />
        </div>
      </section>

      {/* Problem */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">The problem</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Great students. Scattered proof.</h2>
          </motion.div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} {...reveal} transition={{ duration: 0.5, delay: i * 0.1 }} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
                <span className="grid size-12 place-items-center rounded-xl bg-rose-50 text-rose-500"><Icon className="size-6" /></span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How SkillBridge works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Four steps from portfolio to offer letter</h2>
          </motion.div>
          <div className="mt-14 grid gap-6 md:grid-cols-4">
            {PIPELINE.map(({ icon: Icon, label, text }, i) => (
              <motion.div key={label} {...reveal} transition={{ duration: 0.5, delay: i * 0.1 }} className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-0.5 text-xs font-bold text-white">{i + 1}</span>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="size-7" /></span>
                <h3 className="mt-4 text-lg font-bold tracking-wide">{label}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Key features</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Everything the ecosystem needs, in one platform</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <motion.div key={title} {...reveal} transition={{ duration: 0.45, delay: (i % 3) * 0.08 }} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
                <span className="grid size-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-md shadow-brand-600/25"><Icon className="size-6" /></span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section id="workflows" className="scroll-mt-16 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">One platform, three journeys</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Built for students, institutions and employers</h2>
          </motion.div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {WORKFLOWS.map(({ role, icon: Icon, color, steps }, i) => (
              <motion.div key={role} {...reveal} transition={{ duration: 0.5, delay: i * 0.1 }} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
                <div className={cn('bg-gradient-to-br p-6 text-white', color)}>
                  <Icon className="size-8" />
                  <h3 className="mt-3 text-xl font-bold">{role}</h3>
                </div>
                <ol className="space-y-4 p-6">
                  {steps.map((s, n) => (
                    <li key={s} className="flex gap-3 text-sm text-slate-600"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{n + 1}</span>{s}</li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="scroll-mt-16 relative overflow-hidden bg-navy-900 py-20">
        <div className="grid-bg absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-brand-400">Platform statistics</p>
          <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
            <Stat value={stats?.students} label="Student portfolios" />
            <Stat value={stats?.verifiedCredentials} label="Verified credentials" />
            <Stat value={stats?.opportunities} label="Live opportunities" />
            <Stat value={stats?.applications} label="Applications submitted" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div {...reveal} className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">In the demo</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">What each side gets</h2>
            <p className="mt-2 text-xs text-slate-400">Illustrative quotes from the demo personas, not real customers.</p>
          </motion.div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {QUOTES.map((q, i) => (
              <motion.figure key={q.name} {...reveal} transition={{ duration: 0.5, delay: i * 0.1 }} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
                <blockquote className="text-sm leading-relaxed text-slate-600">“{q.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">{q.name[0]}</span>
                  <span><span className="block text-sm font-semibold">{q.name}</span><span className="text-xs text-slate-500">{q.role}</span></span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20">
        <motion.div {...reveal} className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-navy-950 px-8 py-16 text-center text-white">
          <div className="absolute -left-20 -top-20 size-72 rounded-full bg-brand-600/40 blur-[90px]" />
          <div className="absolute -bottom-24 -right-10 size-72 rounded-full bg-violet-brand/40 blur-[90px]" />
          <div className="relative">
            <Users className="mx-auto size-10 text-brand-400" />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to build a portfolio employers trust?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">Create your free account, or explore instantly with a seeded demo account.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={cta.to}><Button size="lg" icon={ArrowRight}>{cta.label}</Button></Link>
              {!user && <Link to="/login"><Button size="lg" variant="dark">Try a demo account</Button></Link>}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 md:flex-row">
          <div><Logo /><p className="mt-2 max-w-xs text-sm text-slate-500">Verified skills. Real opportunities.</p></div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <button onClick={() => scrollTo('how')} className="hover:text-slate-900">How it works</button>
            <button onClick={() => scrollTo('features')} className="hover:text-slate-900">Features</button>
            <Link to="/login" className="hover:text-slate-900">Log in</Link>
            <Link to="/register" className="hover:text-slate-900">Sign up</Link>
          </nav>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} SkillBridge · Cloud Computing course project</p>
        </div>
      </footer>
    </div>
  );
}
