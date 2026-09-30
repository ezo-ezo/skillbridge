import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { Async, Button, Card, PageHeader, Tabs } from '../../components/ui';
import { AppStatusBadge } from '../../components/OpportunityCard';
import { APP_STATUS, OPP_TYPES, fmtDate, matchTone } from '../../utils/format';

const STAGES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];

function Timeline({ status }) {
  if (status === 'REJECTED') return <p className="text-xs font-medium text-rose-600">This application was not successful.</p>;
  const idx = STAGES.indexOf(status);
  return (
    <ol className="flex items-center gap-1" aria-label="Application progress">
      {STAGES.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-1" title={APP_STATUS[s]}>
          <span className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-brand-gradient' : 'bg-slate-200'}`} />
        </li>
      ))}
    </ol>
  );
}

export default function Applications() {
  const state = useFetch('/applications');
  const [tab, setTab] = useState('ALL');

  return (
    <>
      <PageHeader title="My Applications" subtitle="Track every application from applied to offer." actions={<Link to="/student/opportunities"><Button variant="secondary">Find more</Button></Link>} />
      <Async state={state} empty={(d) => !d.applications.length} emptyProps={{ icon: ClipboardList, title: 'No applications yet', message: 'Browse opportunities ranked for you and apply in one click.', action: <Link to="/student/opportunities"><Button>Browse opportunities</Button></Link> }}>
        {({ applications }) => {
          const counts = Object.fromEntries(Object.keys(APP_STATUS).map((s) => [s, applications.filter((a) => a.status === s).length]));
          const shown = tab === 'ALL' ? applications : applications.filter((a) => a.status === tab);
          return (
            <>
              <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'ALL', label: 'All', count: applications.length }, ...Object.entries(APP_STATUS).filter(([s]) => counts[s]).map(([s, l]) => ({ value: s, label: l, count: counts[s] }))]} /></div>
              <div className="space-y-3">
                {shown.map((a) => (
                  <Card key={a.id} hover className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link to={`/student/opportunities/${a.opportunity.id}`} className="text-lg font-bold text-slate-900 hover:text-brand-600">{a.opportunity.title}</Link>
                        <p className="text-sm text-slate-500">{a.opportunity.organization} · {OPP_TYPES[a.opportunity.type]} · {a.opportunity.location}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${matchTone(a.matchScore).text}`}>{a.matchScore}% match</span>
                        <AppStatusBadge status={a.status} />
                      </div>
                    </div>
                    <div className="mt-4"><Timeline status={a.status} /></div>
                    <p className="mt-3 text-xs text-slate-400">Applied {fmtDate(a.createdAt)} · last update {fmtDate(a.updatedAt)}</p>
                  </Card>
                ))}
                {!shown.length && <p className="py-10 text-center text-sm text-slate-400">No applications with this status.</p>}
              </div>
            </>
          );
        }}
      </Async>
    </>
  );
}
