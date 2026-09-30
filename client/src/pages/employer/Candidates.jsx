import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, RotateCcw, Search, Users } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { qs } from '../../services/api';
import { Async, Avatar, Badge, Button, Card, Input, MatchRing, PageHeader, ProgressBar, Select, TagInput, Toggle } from '../../components/ui';
import PortfolioView from '../../components/PortfolioView';
import { cn } from '../../utils/format';

const EMPTY = { skills: [], college: '', degree: '', graduationYear: '', minExperience: '', verifiedOnly: false, opportunityId: '', sort: 'match', q: '' };

function CandidateCard({ c }) {
  return (
    <Card hover className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={c.name} src={c.avatarUrl} size="lg" />
          <div className="min-w-0">
            <Link to={`/employer/candidates/${c.id}`} className="block truncate text-base font-bold text-slate-900 hover:text-brand-600">{c.name}</Link>
            <p className="truncate text-xs text-slate-500">{c.degree} · {c.graduationYear}</p>
            <p className="truncate text-xs text-slate-400">{c.collegeName}</p>
          </div>
        </div>
        {c.matchScore != null && <MatchRing score={c.matchScore} size={58} />}
      </div>
      {c.headline && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{c.headline}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.topSkills.map((s) => (
          <span key={s.name} className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', s.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
            {s.verified && <BadgeCheck className="size-3" />}{s.name}
          </span>
        ))}
      </div>
      {c.missingSkills.length > 0 && <p className="mt-2 text-xs text-amber-700">Missing: {c.missingSkills.join(', ')}</p>}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        <div><p className="text-lg font-bold text-emerald-600">{c.verifiedSkillCount}</p><p className="text-[11px] text-slate-400">Verified skills</p></div>
        <div><p className="text-lg font-bold text-slate-800">{c.verifiedCredentialCount}</p><p className="text-[11px] text-slate-400">Credentials</p></div>
        <div><p className="text-lg font-bold text-slate-800">{c.experienceYears}</p><p className="text-[11px] text-slate-400">Yrs exp.</p></div>
      </div>
      <div className="mt-3"><div className="mb-1 flex justify-between text-[11px] text-slate-400"><span>Profile completion</span><span>{c.completion}%</span></div><ProgressBar value={c.completion} height="h-1.5" /></div>
      <Link to={`/employer/candidates/${c.id}`} className="mt-4"><Button variant="secondary" size="sm" className="w-full">View full profile</Button></Link>
    </Card>
  );
}

export function Candidates() {
  const [params] = useSearchParams();
  const [f, setF] = useState({ ...EMPTY, opportunityId: params.get('opportunityId') ?? '' });
  // Debounce a string key (not an object) so the value is stable between renders.
  const key = useDebounce(JSON.stringify({ ...f, skills: f.skills.join(',') }), 400);
  const state = useFetch(`/candidates${qs(JSON.parse(key))}`);
  const myOpps = useFetch('/opportunities?mine=true');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const dirty = JSON.stringify(f) !== JSON.stringify(EMPTY);

  return (
    <>
      <PageHeader title="Find talent" subtitle="Search verified student portfolios by skills, college and experience." />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside>
          <Card className="space-y-4 p-5 lg:sticky lg:top-24">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input className="!pl-10" placeholder="Name or headline" value={f.q} onChange={set('q')} aria-label="Search candidates" />
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Skills (all required)</label><TagInput value={f.skills} onChange={(skills) => setF((x) => ({ ...x, skills }))} placeholder="React, Python…" suggestions={['React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'SQL', 'Machine Learning', 'TypeScript', 'Figma']} /></div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2.5"><span className="flex items-center gap-2 text-sm font-medium text-emerald-800"><BadgeCheck className="size-4" />Verified skills only</span><Toggle checked={f.verifiedOnly} onChange={(v) => setF((x) => ({ ...x, verifiedOnly: v }))} label="Verified skills only" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">College</label><Input value={f.college} onChange={set('college')} placeholder="e.g. Sahyadri" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Degree</label><Input value={f.degree} onChange={set('degree')} placeholder="e.g. Computer Science" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Grad. year</label><Select value={f.graduationYear} onChange={set('graduationYear')}><option value="">Any</option>{[2025, 2026, 2027, 2028].map((y) => <option key={y}>{y}</option>)}</Select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Min. exp (yrs)</label><Select value={f.minExperience} onChange={set('minExperience')}><option value="">Any</option><option value="0.5">0.5+</option><option value="1">1+</option><option value="2">2+</option></Select></div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Match against my opportunity</label><Select value={f.opportunityId} onChange={set('opportunityId')}><option value="">Use skill filter</option>{myOpps.data?.opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</Select></div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Sort by</label><Select value={f.sort} onChange={set('sort')}><option value="match">Best match</option><option value="verified">Most verified skills</option><option value="completion">Profile completion</option><option value="name">Name</option></Select></div>
            {dirty && <Button variant="ghost" size="sm" icon={RotateCcw} className="w-full" onClick={() => setF(EMPTY)}>Reset filters</Button>}
          </Card>
        </aside>

        <section>
          <Async state={state} label="Searching candidates…" empty={(d) => !d.candidates.length} emptyProps={{ icon: Users, title: 'No candidates match', message: 'Try removing a skill or turning off “verified only”.' }}>
            {({ candidates }) => (
              <>
                <p className="mb-3 text-sm text-slate-500">{candidates.length} candidate{candidates.length === 1 ? '' : 's'}{f.skills.length > 0 && ' matching your skills'}</p>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{candidates.map((c) => <CandidateCard key={c.id} c={c} />)}</div>
              </>
            )}
          </Async>
        </section>
      </div>
    </>
  );
}

export function CandidateProfile() {
  const { id } = useParams();
  const state = useFetch(`/candidates/${id}`);
  return (
    <>
      <Link to="/employer/candidates" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"><ArrowLeft className="size-4" /> Back to search</Link>
      <Async state={state} label="Loading profile…">
        {({ student }) => (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><BadgeCheck className="size-5" /> You are viewing a SkillBridge profile. Only credentials verified by the student's institution are listed.<Badge tone="green" className="ml-auto">{student.skills.filter((s) => s.status === 'VERIFIED').length} verified skills</Badge></div>
            <PortfolioView student={student} />
          </>
        )}
      </Async>
    </>
  );
}
