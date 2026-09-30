import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ClipboardList, FileBadge, Lightbulb } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useOpportunityActions } from '../../hooks/useOpportunityActions';
import { Async, Badge, Button, Card, EmptyState, FadeIn, PageHeader, ProgressBar, SectionTitle, StatCard } from '../../components/ui';
import OpportunityCard, { AppStatusBadge } from '../../components/OpportunityCard';
import ApplyModal from '../../components/ApplyModal';
import { fmtDate, timeAgo } from '../../utils/format';

export default function StudentDashboard() {
  const { user } = useAuth();
  const stats = useFetch('/analytics/student');
  const matches = useFetch('/matches?limit=3');
  const apps = useFetch('/applications');
  const [applying, setApplying] = useState(null);

  const patch = useCallback((id, p) => matches.setData((d) => d && { matches: d.matches.map((m) => (m.id === id ? { ...m, ...p } : m)) }), [matches.setData]);
  const { save, apply } = useOpportunityActions(patch, () => { matches.reload(); apps.reload(); stats.reload(); });

  return (
    <>
      <PageHeader title={`Hi ${user.name.split(' ')[0]} 👋`} subtitle="Here's how your skill portfolio is performing today." actions={<Link to="/student/opportunities"><Button icon={ArrowRight}>Browse opportunities</Button></Link>} />

      <Async state={stats} label="Loading your dashboard…">
        {(s) => (
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Profile Strength" value={`${s.profileStrength}%`} icon={Lightbulb} tone="violet">
                <ProgressBar value={s.profileStrength} className="mt-3" />
              </StatCard>
              <StatCard label="Verified Skills" value={s.skills.verified} icon={BadgeCheck} tone="green" hint={`${s.skills.selfReported} self-reported`} />
              <StatCard label="Credentials" value={s.counts.credentials} icon={FileBadge} hint={`${s.counts.verifiedCredentials} verified · ${s.counts.pendingCredentials} pending`} />
              <StatCard label="Applications" value={s.counts.applications} icon={ClipboardList} tone="amber" hint={`${s.counts.saved} saved opportunities`} />
            </div>

            {s.tips.length > 0 && (
              <Card className="mt-6 p-5">
                <SectionTitle action={<Link to="/student/profile" className="text-sm font-medium text-brand-600 hover:underline">Improve profile</Link>}>Boost your profile strength</SectionTitle>
                <div className="flex flex-wrap gap-2">{s.tips.slice(0, 5).map((t) => <Badge key={t} tone="amber">{t}</Badge>)}</div>
              </Card>
            )}
          </FadeIn>
        )}
      </Async>

      <section className="mt-8">
        <SectionTitle action={<Link to="/student/opportunities" className="text-sm font-medium text-brand-600 hover:underline">See all</Link>}>Recommended for you</SectionTitle>
        <Async state={matches} label="Finding your best matches…" empty={(d) => !d.matches.length} emptyProps={{ title: 'No recommendations yet', message: 'Add skills and get them verified to unlock matches.' }}>
          {(d) => (
            <div className="grid gap-4 lg:grid-cols-3">
              {d.matches.map((o) => <OpportunityCard key={o.id} opp={o} onSave={save} onApply={setApplying} />)}
            </div>
          )}
        </Async>
      </section>

      <section className="mt-8">
        <SectionTitle action={<Link to="/student/applications" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>}>Recent applications</SectionTitle>
        <Async state={apps} empty={(d) => !d.applications.length} emptyProps={{ icon: ClipboardList, title: 'No applications yet', message: 'Apply to a recommended opportunity to get started.' }}>
          {(d) => (
            <Card className="divide-y divide-slate-100">
              {d.applications.slice(0, 4).map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <Link to={`/student/opportunities/${a.opportunity.id}`} className="font-semibold text-slate-900 hover:text-brand-600">{a.opportunity.title}</Link>
                    <p className="text-xs text-slate-500">{a.opportunity.organization} · applied {timeAgo(a.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-xs text-slate-400">{a.matchScore}% match</span><AppStatusBadge status={a.status} /></div>
                </div>
              ))}
            </Card>
          )}
        </Async>
      </section>

      <ApplyModal opp={applying} onClose={() => setApplying(null)} onSubmit={apply} />
    </>
  );
}
