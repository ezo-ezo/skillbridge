import { useFetch } from '../../hooks/useFetch';
import { Async, FadeIn, PageHeader } from '../../components/ui';
import { DonutChart, HBarChart, TrendChart, VBarChart, statusDonut, typeDonut } from '../../components/charts';

export default function InstitutionAnalytics() {
  const state = useFetch('/analytics/institution');
  return (
    <>
      <PageHeader title="Analytics" subtitle="Skill distribution, credential verification, placement outcomes and opportunity participation." />
      <Async state={state}>
        {(d) => (
          <FadeIn className="grid gap-6 lg:grid-cols-2">
            <HBarChart title="Top student skills" subtitle="Number of students per skill" data={d.topSkills} height={320} />
            <DonutChart title="Students by skill category" subtitle="Where your cohort is building strength" data={d.skillsByCategory} height={320} />
            <TrendChart title="Credentials verified over time" subtitle="Submitted vs verified per month" data={d.credentialsOverTime} series={[{ key: 'submitted', label: 'Submitted' }, { key: 'verified', label: 'Verified' }]} />
            {statusDonut(d.applicationOutcomes, 'Placement outcomes', `${d.totals.applications} applications · ${d.totals.placed} placed (${d.totals.placementRate}%)`)}
            {typeDonut(d.participationByType, 'Opportunity participation by type', `${d.totals.participation}% of students have applied`)}
            <VBarChart title="Placements by company" subtitle="Students placed through SkillBridge" data={d.placementByCompany} bars={[{ key: 'value', label: 'Placed' }]} />
          </FadeIn>
        )}
      </Async>
    </>
  );
}
