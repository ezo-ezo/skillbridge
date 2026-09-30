import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { api, qs } from '../../services/api';
import { Async, Avatar, Badge, Card, PageHeader, Select, Tabs } from '../../components/ui';
import { APP_STATUS, errorMessage, fmtDate, matchTone } from '../../utils/format';

export default function EmployerApplications() {
  const [params, setParams] = useSearchParams();
  const opportunityId = params.get('opportunityId') ?? '';
  const [tab, setTab] = useState('ALL');
  const opps = useFetch('/opportunities?mine=true');
  const state = useFetch(`/applications${qs({ opportunityId })}`);

  const setStatus = async (app, status) => {
    const prev = app.status;
    state.setData((d) => ({ applications: d.applications.map((a) => (a.id === app.id ? { ...a, status } : a)) }));
    try { await api.put(`/applications/${app.id}/status`, { status }); toast.success(`${app.student.user.name} → ${APP_STATUS[status]}`); } catch (e) {
      state.setData((d) => ({ applications: d.applications.map((a) => (a.id === app.id ? { ...a, status: prev } : a)) }));
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Applications" subtitle="Review applicants and move them through your hiring pipeline." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select className="md:w-72" value={opportunityId} onChange={(e) => setParams(e.target.value ? { opportunityId: e.target.value } : {})} aria-label="Filter by opportunity">
          <option value="">All opportunities</option>
          {opps.data?.opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
        </Select>
      </div>
      <Async state={state} label="Loading applications…" empty={(d) => !d.applications.length} emptyProps={{ icon: ClipboardList, title: 'No applications yet', message: 'Applications will appear here as students apply to your opportunities.' }}>
        {({ applications }) => {
          const count = (s) => applications.filter((a) => a.status === s).length;
          const shown = tab === 'ALL' ? applications : applications.filter((a) => a.status === tab);
          return (
            <>
              <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'ALL', label: 'All', count: applications.length }, ...Object.entries(APP_STATUS).map(([v, l]) => ({ value: v, label: l, count: count(v) }))]} /></div>
              <div className="space-y-3">
                {shown.map((a) => (
                  <Card key={a.id} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={a.student.user.name} src={a.student.user.avatarUrl} />
                        <div className="min-w-0">
                          <Link to={`/employer/candidates/${a.student.id}`} className="font-semibold text-slate-900 hover:text-brand-600">{a.student.user.name}</Link>
                          <p className="truncate text-xs text-slate-500">{a.student.degree} · {a.student.collegeName}</p>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 md:text-center">
                        <p className="truncate text-sm font-medium text-slate-800">{a.opportunity.title}</p>
                        <p className="text-xs text-slate-400">Applied {fmtDate(a.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${matchTone(a.matchScore).text}`}>{a.matchScore}%</span>
                        <Select className="w-40 !py-1.5" value={a.status} onChange={(e) => setStatus(a, e.target.value)} aria-label={`Status for ${a.student.user.name}`}>
                          {Object.entries(APP_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {a.student.skills.map((s) => <Badge key={s.id} tone="green">✓ {s.skill.name}</Badge>)}
                      {a.coverNote && <p className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm italic text-slate-600">“{a.coverNote}”</p>}
                    </div>
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
