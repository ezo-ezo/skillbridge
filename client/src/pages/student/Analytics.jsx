import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Target, TrendingUp, BadgeCheck, Gauge } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { Async, FadeIn, PageHeader, ProgressBar, StatCard } from '../../components/ui';
import { ChartCard, DonutChart, statusDonut } from '../../components/charts';

export default function StudentAnalytics() {
  const state = useFetch('/analytics/student');
  return (
    <>
      <PageHeader title="My Analytics" subtitle="Skills, profile strength, applications and how well you match the market." />
      <Async state={state}>
        {(s) => (
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Profile strength" value={`${s.profileStrength}%`} icon={Gauge} tone="violet"><ProgressBar value={s.profileStrength} className="mt-3" /></StatCard>
              <StatCard label="Average match rate" value={`${s.matchRate.average}%`} icon={Target} hint={`across ${s.matchRate.totalOpen} open opportunities`} />
              <StatCard label="Strong matches (70%+)" value={s.matchRate.strongMatches} icon={TrendingUp} tone="green" />
              <StatCard label="Verified vs self-reported" value={`${s.skills.verified} / ${s.skills.selfReported}`} icon={BadgeCheck} tone="amber" hint="Verify more skills to lift your matches" />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <ChartCard title="Skill proficiency" subtitle="Green bars are verified skills" empty={!s.skillProficiency.length} height={300}>
                <BarChart data={s.skillProficiency} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => `${v}%`} />
                  <Bar dataKey="proficiency" radius={[0, 8, 8, 0]} barSize={16}>
                    {s.skillProficiency.map((k) => <Cell key={k.name} fill={k.verified ? '#10b981' : '#94a3b8'} />)}
                  </Bar>
                </BarChart>
              </ChartCard>
              <DonutChart title="Skills by category" subtitle="Where your portfolio is strongest" data={s.skillsByCategory} height={300} />
              {statusDonut(s.applicationsByStatus, 'Applications by status', `${s.counts.applications} total`)}
              <ChartCard title="Credentials" subtitle="Verification progress" height={260} empty={!s.counts.credentials}>
                <BarChart data={[{ name: 'Verified', value: s.counts.verifiedCredentials, fill: '#10b981' }, { name: 'Pending', value: s.counts.pendingCredentials, fill: '#f59e0b' }, { name: 'Other', value: s.counts.credentials - s.counts.verifiedCredentials - s.counts.pendingCredentials, fill: '#f43f5e' }]}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {['#10b981', '#f59e0b', '#f43f5e'].map((c) => <Cell key={c} fill={c} />)}
                  </Bar>
                </BarChart>
              </ChartCard>
            </div>
          </FadeIn>
        )}
      </Async>
    </>
  );
}
