import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Eye, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { Async, Badge, Button, Card, ConfirmDialog, Field, Input, PageHeader, Select, TagInput, Textarea, Toggle } from '../../components/ui';
import { OPP_TYPES, WORK_MODES, daysLeft, errorMessage, fmtDate } from '../../utils/format';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const SKILL_SUGGESTIONS = ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'AWS', 'Docker', 'Git', 'Figma', 'Machine Learning'];

export function MyOpportunities() {
  const state = useFetch('/opportunities?mine=true&sort=newest');
  const [deleting, setDeleting] = useState(null);

  const remove = async () => {
    try { await api.del(`/opportunities/${deleting.id}`); toast.success('Opportunity deleted'); setDeleting(null); state.reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="My opportunities" subtitle="Internships, jobs and events you've posted." actions={<Link to="/employer/opportunities/new"><Button icon={Plus}>Post opportunity</Button></Link>} />
      <Async state={state} empty={(d) => !d.opportunities.length} emptyProps={{ icon: Briefcase, title: 'Nothing posted yet', message: 'Post your first opportunity to start receiving matched applicants.', action: <Link to="/employer/opportunities/new"><Button icon={Plus}>Post opportunity</Button></Link> }}>
        {({ opportunities }) => (
          <div className="space-y-3">
            {opportunities.map((o) => {
              const expired = new Date(o.deadline) < new Date();
              return (
                <Card key={o.id} hover className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap gap-1.5"><Badge tone="blue">{OPP_TYPES[o.type]}</Badge><Badge>{WORK_MODES[o.workMode]}</Badge>{expired ? <Badge tone="red">Closed</Badge> : !o.isActive ? <Badge tone="amber">Paused</Badge> : <Badge tone="green">Live</Badge>}</div>
                      <h3 className="text-lg font-bold text-slate-900">{o.title}</h3>
                      <p className="text-sm text-slate-500">{o.location} · {o.compensation || 'Compensation not listed'} · Deadline {fmtDate(o.deadline)} ({daysLeft(o.deadline)})</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">{o.skills.map((s) => <span key={s.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s.name}</span>)}</div>
                    </div>
                    <div className="flex items-center gap-5 text-center">
                      <div><p className="flex items-center justify-center gap-1 text-lg font-bold text-slate-800"><Eye className="size-4 text-slate-400" />{o.views}</p><p className="text-[11px] text-slate-400">Views</p></div>
                      <Link to={`/employer/applications?opportunityId=${o.id}`} className="hover:text-brand-600"><p className="flex items-center justify-center gap-1 text-lg font-bold text-slate-800"><Users className="size-4 text-slate-400" />{o.applicationCount}</p><p className="text-[11px] text-slate-400">Applicants</p></Link>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <Link to={`/employer/candidates?opportunityId=${o.id}`}><Button size="sm" variant="secondary" icon={Users}>Find matches</Button></Link>
                    <Link to={`/employer/opportunities/${o.id}/edit`}><Button size="sm" variant="secondary" icon={Pencil}>Edit</Button></Link>
                    <Button size="sm" variant="ghost" icon={Trash2} className="!text-rose-600" onClick={() => setDeleting(o)}>Delete</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Async>
      <ConfirmDialog open={!!deleting} title="Delete opportunity?" message={`“${deleting?.title}” and all of its applications will be permanently deleted.`} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}

export function OpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useFetch(`/opportunities/${id}`, { enabled: !!id });
  return (
    <>
      <PageHeader title={id ? 'Edit opportunity' : 'Post an opportunity'} subtitle="Students are matched to it automatically based on the skills you list." />
      {id
        ? <Async state={existing}>{({ opportunity }) => <FormBody key={opportunity.id} opp={opportunity} onDone={() => navigate('/employer/opportunities')} />}</Async>
        : <FormBody onDone={() => navigate('/employer/opportunities')} />}
    </>
  );
}

function FormBody({ opp, onDone }) {
  const [f, setF] = useState({
    title: opp?.title ?? '', type: opp?.type ?? 'INTERNSHIP', description: opp?.description ?? '', location: opp?.location ?? '',
    workMode: opp?.workMode ?? 'HYBRID', skills: opp?.skills.map((s) => s.name) ?? [], minExperience: opp?.minExperience ?? 0,
    deadline: toDateInput(opp?.deadline) || '', compensation: opp?.compensation ?? '', applicationUrl: opp?.applicationUrl ?? '', isActive: opp?.isActive ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const body = { ...f, minExperience: Number(f.minExperience) };
      if (opp) await api.put(`/opportunities/${opp.id}`, body); else await api.post('/opportunities', body);
      toast.success(opp ? 'Opportunity updated' : 'Opportunity posted');
      onDone();
    } catch (er) { setErr(errorMessage(er)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit}>
      <Card className="grid max-w-4xl gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="sm:col-span-2"><Field label="Title" required>{(id) => <Input id={id} required value={f.title} onChange={set('title')} placeholder="Frontend Developer Intern" />}</Field></div>
        <Field label="Type" required>{(id) => <Select id={id} value={f.type} onChange={set('type')}>{Object.entries(OPP_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
        <Field label="Work mode" required>{(id) => <Select id={id} value={f.workMode} onChange={set('workMode')}>{Object.entries(WORK_MODES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
        <Field label="Location" required>{(id) => <Input id={id} required value={f.location} onChange={set('location')} placeholder="Bengaluru / Remote" />}</Field>
        <Field label="Application deadline" required>{(id) => <Input id={id} type="date" required value={f.deadline} onChange={set('deadline')} />}</Field>
        <div className="sm:col-span-2"><Field label="Description" required hint="At least 20 characters.">{(id) => <Textarea id={id} required rows={6} value={f.description} onChange={set('description')} maxLength={5000} />}</Field></div>
        <div className="sm:col-span-2"><Field label="Skills required" hint="These drive candidate matching. Press Enter after each skill." required>{() => <TagInput value={f.skills} onChange={(skills) => setF((x) => ({ ...x, skills }))} placeholder="React, Node.js…" suggestions={SKILL_SUGGESTIONS} />}</Field></div>
        <Field label="Experience required (years)">{(id) => <Input id={id} type="number" min={0} max={20} value={f.minExperience} onChange={set('minExperience')} />}</Field>
        <Field label="Stipend / salary">{(id) => <Input id={id} value={f.compensation} onChange={set('compensation')} placeholder="₹25,000/month" />}</Field>
        <div className="sm:col-span-2"><Field label="Application URL">{(id) => <Input id={id} value={f.applicationUrl} onChange={set('applicationUrl')} placeholder="https://company.com/careers/role" />}</Field></div>
        {opp && <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2"><div><p className="text-sm font-medium text-slate-900">Accepting applications</p><p className="text-xs text-slate-500">Turn off to hide this from students.</p></div><Toggle checked={f.isActive} onChange={(v) => setF((x) => ({ ...x, isActive: v }))} label="Accepting applications" /></div>}
        {err && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:col-span-2" role="alert">{err}</p>}
        <div className="flex justify-end gap-3 sm:col-span-2"><Button type="button" variant="secondary" onClick={onDone}>Cancel</Button><Button type="submit" loading={busy}>{opp ? 'Save changes' : 'Publish opportunity'}</Button></div>
      </Card>
    </form>
  );
}
