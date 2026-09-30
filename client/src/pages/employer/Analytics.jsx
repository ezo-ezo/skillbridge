import { Eye, Percent, Target, Trophy } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { Async, FadeIn, PageHeader, StatCard } from '../../components/ui';
import { TrendChart, VBarChart, PALETTE } from '../../components/charts';
import { PipelineChart } from './Dashboard';

export default function EmployerAnalytics() {
  const state = useFetch('/analytics/employer');
  return (
    <>
      <PageHeader title="Hiring analytics" subtitle="Job views, applications, candidate pipeline and hiring statistics." />
      <Async state={state}>
        {({ totals, jobViews, pipeline, applicationsOverTime }) => (
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Job views" value={totals.views} icon={Eye} tone="violet" />
              <StatCard label="Applications" value={totals.applications} icon={Target} />
              <StatCard label="Hire rate" value={`${totals.hireRate}%`} icon={Percent} tone="green" hint={`${totals.hired} hired`} />
              <StatCard label="Avg. applicant match" value={`${totals.avgMatch}%`} icon={Trophy} tone="amber" />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <VBarChart title="Views and applications" subtitle="Per opportunity" data={jobViews} bars={[{ key: 'views', label: 'Views' }, { key: 'applications', label: 'Applications' }]} colors={[PALETTE[0], PALETTE[1]]} height={320} />
              <PipelineChart data={pipeline} />
              <div className="lg:col-span-2"><TrendChart title="Applications over time" subtitle="Last 6 months" data={applicationsOverTime} series={[{ key: 'applications', label: 'Applications' }]} /></div>
            </div>
          </FadeIn>
        )}
      </Async>
    </>
  );
}
