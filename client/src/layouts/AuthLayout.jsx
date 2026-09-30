import { motion } from 'framer-motion';
import { BadgeCheck, Link2, Sparkles, Hammer } from 'lucide-react';
import Logo from '../components/Logo';

const STEPS = [
  { icon: Hammer, label: 'Build', text: 'One living portfolio for projects, skills and certificates.' },
  { icon: BadgeCheck, label: 'Verify', text: 'Your institution confirms credentials, so employers can trust them.' },
  { icon: Sparkles, label: 'Match', text: 'Verified skills are matched to internships, jobs and hackathons.' },
  { icon: Link2, label: 'Connect', text: 'Apply in one click; employers find you by proven skills.' },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col">
        <div className="grid-bg absolute inset-0" />
        <div className="absolute -left-24 top-1/3 size-96 rounded-full bg-brand-600/30 blur-[110px]" />
        <div className="absolute -right-16 bottom-10 size-80 rounded-full bg-violet-brand/30 blur-[110px]" />
        <div className="relative"><Logo dark /></div>
        <div className="relative my-auto max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Turn verified skills into <span className="text-brand-gradient">real opportunities.</span></h2>
          <ul className="mt-10 space-y-5">
            {STEPS.map(({ icon: Icon, label, text }, i) => (
              <motion.li key={label} className="glass flex items-start gap-4 rounded-2xl p-4" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient"><Icon className="size-5" /></span>
                <div><p className="font-semibold">{label}</p><p className="text-sm text-slate-300">{text}</p></div>
              </motion.li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} SkillBridge. Built for students, institutions and employers.</p>
      </aside>
      <main className="flex items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mb-7 mt-2 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
