import { Link } from 'react-router-dom';
import { Briefcase, Eye, Plus, Target, Trophy, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { Async, Button, FadeIn, PageHeader, StatCard } from '../../components/ui';
import { ChartCard, VBarChart, TrendChart, PALETTE } from '../../components/charts';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { APP_STATUS } from '../../utils/format';

const STAGE_COLOR = { APPLIED: '#4479f5', UNDER_REVIEW: '#f59e0b', SHORTLISTED: '#7c5cf0', INTERVIEW: '#06b6d4', SELECTED: '#10b981', REJECTED: '#f43f5e' };

export function PipelineChart({ data }) {
  const rows = data.map((d) => ({ ...d, name: APP_STATUS[d.status] }));
  return (
    <ChartCard title="Candidate pipeline" subtitle="Applicants at each hiring stage" empty={rows.every((r) => !r.value)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey="value" name="Candidates" radius={[0, 8, 8, 0]} barSize={18}>{rows.map((r) => <Cell key={r.status} fill={STAGE_COLOR[r.status]} />)}</Bar>
      </BarChart>
    </ChartCard>
  );
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const stats = useFetch('/analytics/employer');
  return (
    <>
      <PageHeader title={user.profile?.companyName ?? 'Employer'} subtitle={`Welcome, ${user.name.split(' ')[0]}. Here is your hiring snapshot.`} actions={<><Link to="/employer/candidates"><Button variant="secondary" icon={Users}>Find talent</Button></Link><Link to="/employer/opportunities/new"><Button icon={Plus}>Post opportunity</Button></Link></>} />
      <Async state={stats} label="Loading hiring stats…">
        {({ totals, jobViews, pipeline, applicationsOverTime }) => (
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Active opportunities" value={totals.active} icon={Briefcase} hint={`${totals.opportunities} posted in total`} />
              <StatCard label="Total views" value={totals.views} icon={Eye} tone="violet" />
              <StatCard label="Applications" value={totals.applications} icon={Users} tone="amber" hint={`${totals.shortlisted} shortlisted or interviewing`} />
              <StatCard label="Hires" value={totals.hired} icon={Trophy} tone="green" hint={`${totals.hireRate}% hire rate`} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><StatCard label="Average applicant match" value={`${totals.avgMatch}%`} icon={Target} hint="How well applicants fit your required skills" /></div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <VBarChart title="Views and applications" subtitle="Per opportunity" data={jobViews} bars={[{ key: 'views', label: 'Views' }, { key: 'applications', label: 'Applications' }]} colors={[PALETTE[0], PALETTE[1]]} height={300} />
              <PipelineChart data={pipeline} />
            </div>
            <div className="mt-6"><TrendChart title="Applications over time" subtitle="Last 6 months" data={applicationsOverTime} series={[{ key: 'applications', label: 'Applications' }]} /></div>
          </FadeIn>
        )}
      </Async>
    </>
  );
}
