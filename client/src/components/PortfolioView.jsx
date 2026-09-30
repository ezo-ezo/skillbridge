import { motion } from 'framer-motion';
import {
  Award, BadgeCheck, Briefcase, Calendar, ExternalLink, FileText, GraduationCap, Globe, MapPin,
  Mail, Sparkles, Trophy, Users, Workflow,
} from 'lucide-react';
import { Github, Linkedin } from './BrandIcons';
import { Avatar, Badge, Card, ProgressBar, SectionTitle, SkillBar, VerifiedBadge } from './ui';
import { CRED_TYPES, cn, fmtDate, fmtMonthYear } from '../utils/format';

// Authenticated API returns skills as {skill:{name,category}}, the public API flattens them. Normalise both.
export function normalizeStudent(s) {
  return {
    ...s,
    skills: (s.skills || []).map((k) => ({
      id: k.id, name: k.skill?.name ?? k.name, category: k.skill?.category ?? k.category,
      proficiency: k.proficiency, status: k.status, evidence: k.evidence,
    })),
    completionScore: typeof s.completion === 'number' ? s.completion : s.completion?.score ?? 0,
  };
}

const Section = ({ icon: Icon, title, count, children, delay = 0 }) => (
  <motion.section initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay }}>
    <SectionTitle>
      <span className="flex items-center gap-2"><Icon className="size-[18px] text-brand-500" />{title}{count != null && <span className="text-sm font-normal text-slate-400">({count})</span>}</span>
    </SectionTitle>
    {children}
  </motion.section>
);

export function VerifiedCredentialCard({ c }) {
  const v = c.verifications?.find((x) => x.decision === 'VERIFIED');
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Badge tone="violet">{CRED_TYPES[c.type]}</Badge>
          <h4 className="mt-2 font-semibold leading-snug text-slate-900">{c.title}</h4>
          <p className="text-sm text-slate-500">{c.issuer} · {fmtMonthYear(c.issuedOn)}</p>
        </div>
        <VerifiedBadge status={c.status} />
      </div>
      {(v || c.verifiedBy) && c.status === 'VERIFIED' && (
        <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">
          Verified by {v?.verifier?.name ?? c.verifiedBy ?? 'institution'} on {fmtDate(v?.createdAt ?? c.verifiedAt)}
        </p>
      )}
      {c.credentialId && <p className="mt-1 font-mono text-[11px] text-slate-400">ID: {c.credentialId}</p>}
    </Card>
  );
}

export function ProjectCardView({ p, onClick }) {
  return (
    <Card hover className={cn('overflow-hidden', onClick && 'cursor-pointer')} onClick={onClick}>
      {p.imageUrl
        ? <img src={p.imageUrl} alt={`${p.title} screenshot`} className="h-32 w-full object-cover" loading="lazy" />
        : <div className="h-24 bg-gradient-to-br from-brand-500 via-violet-brand to-fuchsia-400 p-4"><Workflow className="size-7 text-white/80" /></div>}
      <div className="p-4">
        <h4 className="font-semibold text-slate-900">{p.title}</h4>
        <p className="mt-1 line-clamp-3 text-sm text-slate-500">{p.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{p.technologies.map((t) => <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{t}</span>)}</div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Users className="size-3.5" />{p.teamSize} {p.teamSize === 1 ? 'member' : 'members'}</span>
          {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-brand-600"><Github className="size-3.5" />Code</a>}
          {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-brand-600"><ExternalLink className="size-3.5" />Live</a>}
        </div>
      </div>
    </Card>
  );
}

/**
 * The portfolio. Used for the student's own profile, the public page, and employer/institution views.
 * `showPrivate` adds non-verified credentials with their status (owner / institution only).
 */
export default function PortfolioView({ student: raw, showPrivate = false, actions, hero = true }) {
  const s = normalizeStudent(raw);
  const technical = s.skills.filter((k) => k.category !== 'Soft Skills');
  const soft = s.skills.filter((k) => k.category === 'Soft Skills');
  const verified = technical.filter((k) => k.status === 'VERIFIED');
  const selfReported = technical.filter((k) => k.status !== 'VERIFIED');
  const verifiedCreds = s.credentials.filter((c) => c.status === 'VERIFIED');
  const otherCreds = s.credentials.filter((c) => c.status !== 'VERIFIED');

  return (
    <div className="space-y-8">
      {hero && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-navy-900 text-white shadow-card">
          <div className="grid-bg absolute inset-0" />
          <div className="absolute -right-16 -top-16 size-72 rounded-full bg-brand-600/40 blur-[90px]" />
          <div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-violet-brand/30 blur-[90px]" />
          <div className="relative flex flex-col gap-6 p-6 sm:p-9 md:flex-row md:items-center">
            <Avatar name={s.name} src={s.avatarUrl} size="xl" className="!ring-4 !ring-white/20" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{s.name}</h1>
                {verified.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30"><BadgeCheck className="size-3.5" />{verified.length} VERIFIED SKILLS</span>}
              </div>
              {s.headline && <p className="mt-1.5 text-base text-slate-200">{s.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><GraduationCap className="size-4" />{s.degree} · {s.collegeName} · {s.graduationYear}</span>
                {s.location && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{s.location}</span>}
                {s.email && <span className="flex items-center gap-1.5"><Mail className="size-4" />{s.email}</span>}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[[s.githubUrl, Github, 'GitHub'], [s.linkedinUrl, Linkedin, 'LinkedIn'], [s.portfolioUrl, Globe, 'Website']].filter(([u]) => u).map(([u, Icon, l]) => (
                  <a key={l} href={u} target="_blank" rel="noreferrer" className="glass inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/15"><Icon className="size-3.5" />{l}</a>
                ))}
                {s.resumeUrl && <a href={s.resumeUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold"><FileText className="size-3.5" />Resume</a>}
                {actions}
              </div>
            </div>
            <div className="w-full rounded-2xl bg-white/10 p-4 md:w-56">
              <p className="text-xs font-semibold tracking-wide text-slate-300">PROFILE STRENGTH</p>
              <p className="mt-1 text-3xl font-extrabold">{s.completionScore}%</p>
              <ProgressBar value={s.completionScore} className="mt-2 !bg-white/15" />
            </div>
          </div>
        </motion.div>
      )}

      {s.bio && <Card className="p-6"><h2 className="mb-2 font-semibold text-slate-900">About</h2><p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{s.bio}</p>{s.interests?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{s.interests.map((i) => <Badge key={i} tone="blue">{i}</Badge>)}</div>}</Card>}

      <div className="grid gap-8 lg:grid-cols-2">
        <Section icon={Sparkles} title="Verified skills" count={verified.length}>
          <Card className="space-y-4 p-5">
            {verified.length ? verified.map((k) => <SkillBar key={k.id ?? k.name} name={k.name} proficiency={k.proficiency} status="VERIFIED" />) : <p className="text-sm text-slate-400">No verified skills yet.</p>}
          </Card>
        </Section>
        <Section icon={Sparkles} title="Self-reported skills" count={selfReported.length} delay={0.05}>
          <Card className="space-y-4 p-5">
            {selfReported.length ? selfReported.map((k) => <SkillBar key={k.id ?? k.name} name={k.name} proficiency={k.proficiency} status="PENDING" />) : <p className="text-sm text-slate-400">All skills are verified.</p>}
          </Card>
        </Section>
      </div>

      <Section icon={BadgeCheck} title="Verified credentials" count={verifiedCreds.length}>
        {verifiedCreds.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{verifiedCreds.map((c) => <VerifiedCredentialCard key={c.id} c={c} />)}</div> : <p className="text-sm text-slate-400">No verified credentials yet.</p>}
      </Section>

      {showPrivate && otherCreds.length > 0 && (
        <Section icon={Award} title="Awaiting / rejected credentials" count={otherCreds.length}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{otherCreds.map((c) => <VerifiedCredentialCard key={c.id} c={c} />)}</div>
        </Section>
      )}

      <Section icon={Workflow} title="Projects" count={s.projects.length}>
        {s.projects.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{s.projects.map((p) => <ProjectCardView key={p.id} p={p} />)}</div> : <p className="text-sm text-slate-400">No projects added.</p>}
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        {s.experiences?.length > 0 && (
          <Section icon={Briefcase} title="Experience">
            <Card className="divide-y divide-slate-100">
              {s.experiences.map((e) => (
                <div key={e.id} className="p-5">
                  <p className="font-semibold text-slate-900">{e.title}</p>
                  <p className="text-sm text-slate-500">{e.company}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><Calendar className="size-3" />{fmtMonthYear(e.startDate)} – {e.endDate ? fmtMonthYear(e.endDate) : 'Present'}</p>
                  {e.description && <p className="mt-2 text-sm text-slate-600">{e.description}</p>}
                </div>
              ))}
            </Card>
          </Section>
        )}
        {s.achievements?.length > 0 && (
          <Section icon={Trophy} title="Achievements">
            <Card className="divide-y divide-slate-100">
              {s.achievements.map((a) => (
                <div key={a.id} className="flex gap-3 p-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500"><Trophy className="size-4" /></span>
                  <div><p className="font-semibold text-slate-900">{a.title}</p>{a.description && <p className="text-sm text-slate-500">{a.description}</p>}</div>
                </div>
              ))}
            </Card>
          </Section>
        )}
      </div>

      {soft.length > 0 && (
        <Section icon={Users} title="Soft skills">
          <div className="flex flex-wrap gap-2">{soft.map((k) => <Badge key={k.name} tone={k.status === 'VERIFIED' ? 'green' : 'slate'}>{k.name}</Badge>)}</div>
        </Section>
      )}
    </div>
  );
}
