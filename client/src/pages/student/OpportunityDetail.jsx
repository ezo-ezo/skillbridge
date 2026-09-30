import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Calendar, Check, ExternalLink, MapPin, Sparkles, Wallet, X } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useOpportunityActions } from '../../hooks/useOpportunityActions';
import { Async, Badge, Button, Card, FadeIn, MatchRing, ProgressBar } from '../../components/ui';
import { AppStatusBadge } from '../../components/OpportunityCard';
import ApplyModal from '../../components/ApplyModal';
import { OPP_TYPES, WORK_MODES, fmtDate, daysLeft, matchTone } from '../../utils/format';

export default function OpportunityDetail() {
  const { id } = useParams();
  const opp = useFetch(`/opportunities/${id}`);
  const match = useFetch(`/opportunities/${id}/match`);
  const [applying, setApplying] = useState(false);

  const patch = useCallback((_id, p) => opp.setData((d) => d && { opportunity: { ...d.opportunity, ...p } }), [opp.setData]);
  const { save, apply } = useOpportunityActions(patch, opp.reload);

  return (
    <>
      <Link to="/student/opportunities" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"><ArrowLeft className="size-4" /> All opportunities</Link>
      <Async state={opp} label="Loading opportunity…">
        {({ opportunity: o }) => {
          const m = match.data?.match;
          const tone = matchTone(o.match.score);
          return (
            <FadeIn className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-6">
                <Card className="p-6 sm:p-8">
                  <div className="mb-3 flex flex-wrap gap-2"><Badge tone="blue">{OPP_TYPES[o.type]}</Badge><Badge>{WORK_MODES[o.workMode]}</Badge>{o.minExperience > 0 && <Badge tone="amber">{o.minExperience}+ yr experience</Badge>}</div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{o.title}</h1>
                  <p className="mt-1 text-base font-medium text-slate-500">{o.organization}</p>
                  <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <span className="flex items-center gap-2"><MapPin className="size-4 text-slate-400" />{o.location}</span>
                    <span className="flex items-center gap-2"><Wallet className="size-4 text-slate-400" />{o.compensation || 'Not disclosed'}</span>
                    <span className="flex items-center gap-2"><Calendar className="size-4 text-slate-400" />{fmtDate(o.deadline)} · {daysLeft(o.deadline)}</span>
                  </div>
                  <hr className="my-6 border-slate-100" />
                  <h2 className="mb-2 font-semibold text-slate-900">About this opportunity</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{o.description}</p>
                  <h2 className="mb-2 mt-6 font-semibold text-slate-900">Skills required</h2>
                  <div className="flex flex-wrap gap-2">{o.skills.map((s) => <span key={s.id} className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{s.name}</span>)}</div>
                  <p className="mt-6 text-xs text-slate-400">Posted {fmtDate(o.postedAt)} · {o.views} views · {o.applicationCount ?? 0} applicants</p>
                </Card>
              </div>

              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <MatchRing score={o.match.score} size={84} />
                    <div>
                      <p className={`text-lg font-bold ${tone.text}`}>{tone.label} match</p>
                      <p className="text-xs text-slate-500">Based on your verified skills, projects and experience.</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {o.match.matched.map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-800"><Check className="size-4 text-emerald-500" />{s.name}</span>
                        <Badge tone={s.source === 'verified' ? 'green' : 'slate'}>{s.source === 'verified' ? 'Verified' : s.source === 'project' ? 'From project' : 'Self-reported'}</Badge>
                      </div>
                    ))}
                    {o.match.missing.length > 0 && (
                      <div className="pt-2">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Missing</p>
                        {o.match.missing.map((s) => <div key={s} className="flex items-center gap-2 py-0.5 text-sm text-amber-700"><X className="size-4" />{s}</div>)}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl bg-gradient-to-br from-brand-50 to-violet-50 p-4">
                    <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900"><Sparkles className="size-4 text-brand-500" /> Why this matches you</p>
                    {match.loading && <p className="text-sm text-slate-400">Analysing your profile…</p>}
                    {m && <p className="text-sm leading-relaxed text-slate-700">{m.explanation}</p>}
                    {match.error && <p className="text-sm text-slate-500">Match details are unavailable right now.</p>}
                    {m?.breakdown && (
                      <div className="mt-3 space-y-2">
                        {[['Skills', m.breakdown.skills], ['Experience', m.breakdown.experience], ['Interests', m.breakdown.interest]].map(([l, v]) => (
                          <div key={l}><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{l}</span><span>{v}%</span></div><ProgressBar value={v} height="h-1.5" /></div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex gap-2">
                    {o.applicationStatus
                      ? <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm"><span className="text-slate-500">Application:</span><AppStatusBadge status={o.applicationStatus} /></div>
                      : <Button className="flex-1" onClick={() => setApplying(true)}>Apply now</Button>}
                    <Button variant="secondary" onClick={() => save(o)} aria-label="Save">{o.saved ? <BookmarkCheck className="size-4 text-brand-600" /> : <Bookmark className="size-4" />}</Button>
                  </div>
                  {o.applicationUrl && <a href={o.applicationUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"><ExternalLink className="size-3.5" /> Company careers page</a>}
                </Card>
              </aside>
              {applying && <ApplyModal opp={o} onClose={() => setApplying(false)} onSubmit={apply} />}
            </FadeIn>
          );
        }}
      </Async>
    </>
  );
}
