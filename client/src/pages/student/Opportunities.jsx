import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useOpportunityActions } from '../../hooks/useOpportunityActions';
import { qs } from '../../services/api';
import { Async, Input, PageHeader, Select, Tabs } from '../../components/ui';
import OpportunityCard from '../../components/OpportunityCard';
import ApplyModal from '../../components/ApplyModal';
import { OPP_TYPES, WORK_MODES, cn } from '../../utils/format';

export default function Opportunities() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [sort, setSort] = useState('match');
  const [tab, setTab] = useState('all');
  const [applying, setApplying] = useState(null);
  const dq = useDebounce(q);

  const state = useFetch(`/opportunities${qs({ q: dq, type, workMode, sort, saved: tab === 'saved' })}`);
  const patch = useCallback((id, p) => state.setData((d) => d && { opportunities: d.opportunities.map((o) => (o.id === id ? { ...o, ...p } : o)) }), [state.setData]);
  const { save, apply } = useOpportunityActions(patch, state.reload);

  return (
    <>
      <PageHeader title="Opportunities" subtitle="Internships, jobs, hackathons and more, ranked by how well your verified skills fit." />

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, company or keyword…" className="!pl-10" aria-label="Search opportunities" />
          </div>
          <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="md:w-40" aria-label="Work mode">
            <option value="">Any work mode</option>
            {Object.entries(WORK_MODES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="md:w-44" aria-label="Sort by">
            <option value="match">Best match</option>
            <option value="newest">Newest</option>
            <option value="deadline">Deadline soonest</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[['', 'All types'], ...Object.entries(OPP_TYPES)].map(([v, l]) => (
              <button key={v} onClick={() => setType(v)} className={cn('rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors', type === v ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400')}>{l}</button>
            ))}
          </div>
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All' }, { value: 'saved', label: 'Saved' }]} />
        </div>
      </div>

      <Async state={state} label="Loading opportunities…" empty={(d) => !d.opportunities.length}
        emptyProps={{ icon: Search, title: tab === 'saved' ? 'Nothing saved yet' : 'No opportunities found', message: tab === 'saved' ? 'Tap the bookmark on any opportunity to save it for later.' : 'Try a different search or clear the filters.' }}>
        {(d) => (
          <>
            <p className="mb-3 text-sm text-slate-500">{d.opportunities.length} result{d.opportunities.length === 1 ? '' : 's'}</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {d.opportunities.map((o) => <OpportunityCard key={o.id} opp={o} onSave={save} onApply={setApplying} />)}
            </div>
          </>
        )}
      </Async>
      <ApplyModal opp={applying} onClose={() => setApplying(null)} onSubmit={apply} />
    </>
  );
}
