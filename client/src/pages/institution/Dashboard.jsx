import { Link } from 'react-router-dom';
import { Activity, BadgeCheck, Clock, GraduationCap, Percent, Trophy, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Async, Badge, Button, Card, FadeIn, PageHeader, ProgressBar, SectionTitle, StatCard } from '../../components/ui';
import { HBarChart, TrendChart, statusDonut } from '../../components/charts';
import { CRED_TYPES, timeAgo } from '../../utils/format';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const stats = useFetch('/analytics/institution');
  const pending = useFetch('/verification/pending');

  return (
    <>
      <PageHeader title={user.name} subtitle="Institution overview: skills, verifications and placement outcomes." actions={<Link to="/institution/verification"><Button icon={BadgeCheck}>Open verification center</Button></Link>} />
      <Async state={stats} label="Loading analytics…">
        {({ totals, topSkills, credentialsOverTime, applicationOutcomes }) => (
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total students" value={totals.students} icon={Users} />
              <StatCard label="Verified credentials" value={totals.verifiedCredentials} icon={BadgeCheck} tone="green" hint={`${totals.rejectedCredentials} rejected`} />
              <StatCard label="Pending verifications" value={totals.pendingVerifications} icon={Clock} tone="amber" hint={totals.pendingVerifications ? 'Needs your review' : 'All caught up'} />
              <StatCard label="Avg. profile completion" value={`${totals.averageCompletion}%`} icon={Percent} tone="violet"><ProgressBar value={totals.averageCompletion} className="mt-3" /></StatCard>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <StatCard label="Placed students" value={totals.placed} icon={Trophy} tone="green" hint={`${totals.placementRate}% placement rate`} />
              <StatCard label="Opportunity participation" value={`${totals.participation}%`} icon={Activity} hint="Students who applied to at least one opportunity" />
              <StatCard label="Applications" value={totals.applications} icon={GraduationCap} tone="amber" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <HBarChart title="Top student skills" subtitle="Most common skills across your cohort" data={topSkills} height={300} />
              <TrendChart title="Credentials over time" subtitle="Submitted vs verified, last 6 months" data={credentialsOverTime} series={[{ key: 'submitted', label: 'Submitted' }, { key: 'verified', label: 'Verified' }]} height={300} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {statusDonut(applicationOutcomes, 'Placement outcomes', 'Status of all student applications')}
              <Card className="p-5">
                <SectionTitle action={<Link to="/institution/verification" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>}>Awaiting verification</SectionTitle>
                <Async state={pending} empty={(d) => !d.credentials.length} emptyProps={{ icon: BadgeCheck, title: 'Nothing pending', message: 'New submissions will show up here.' }}>
                  {({ credentials }) => (
                    <ul className="divide-y divide-slate-100">
                      {credentials.slice(0, 5).map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{c.title}</p><p className="truncate text-xs text-slate-500">{c.student.user.name} · {timeAgo(c.createdAt)}</p></div>
                          <Badge tone="violet">{CRED_TYPES[c.type]}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </Async>
              </Card>
            </div>
          </FadeIn>
        )}
      </Async>
    </>
  );
}
