import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, Info, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { Async, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select, SectionTitle, SkillBar, Textarea } from '../../components/ui';
import { errorMessage } from '../../utils/format';

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Cloud & DevOps', 'Data & AI', 'Programming', 'Tools', 'Soft Skills', 'General'];

function SkillModal({ skill, catalog, onClose, onSaved }) {
  const [f, setF] = useState({ name: skill?.skill.name ?? '', category: skill?.skill.category ?? 'General', proficiency: skill?.proficiency ?? 60, evidence: skill?.evidence ?? '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const known = catalog.find((c) => c.name.toLowerCase() === f.name.trim().toLowerCase());

  const save = async () => {
    setBusy(true); setErr('');
    try {
      if (skill) await api.put(`/student-skills/${skill.id}`, { name: skill.skill.name, proficiency: Number(f.proficiency), evidence: f.evidence });
      else await api.post('/student-skills', { name: f.name, category: known?.category ?? f.category, proficiency: Number(f.proficiency), evidence: f.evidence });
      toast.success(skill ? 'Skill updated' : 'Skill added');
      onSaved();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={skill ? `Edit ${skill.skill.name}` : 'Add a skill'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>{skill ? 'Save' : 'Add skill'}</Button></>}>
      <div className="space-y-4">
        {!skill && (
          <>
            <Field label="Skill name" required>{(id) => <Input id={id} list="skill-catalog" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. React" autoFocus />}</Field>
            <datalist id="skill-catalog">{catalog.map((c) => <option key={c.id} value={c.name} />)}</datalist>
            {!known && f.name.trim() && <Field label="Category">{(id) => <Select id={id} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>}</Field>}
          </>
        )}
        <Field label={`Proficiency: ${f.proficiency}%`}>
          {(id) => <input id={id} type="range" min="5" max="100" step="5" value={f.proficiency} onChange={(e) => setF({ ...f, proficiency: e.target.value })} className="w-full accent-brand-500" />}
        </Field>
        <Field label="Evidence" hint="Link a project, repo or describe where you used this skill.">{(id) => <Textarea id={id} rows={3} value={f.evidence} onChange={(e) => setF({ ...f, evidence: e.target.value })} maxLength={500} />}</Field>
      </div>
      {err && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{err}</p>}
    </Modal>
  );
}

export default function Skills() {
  const state = useFetch('/students/me');
  const catalog = useFetch('/skills');
  const [editing, setEditing] = useState(null); // null | 'new' | studentSkill
  const [deleting, setDeleting] = useState(null);

  const remove = async () => {
    try { await api.del(`/student-skills/${deleting.id}`); toast.success('Skill removed'); setDeleting(null); state.reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  const Row = ({ s }) => (
    <div className="group">
      <SkillBar name={s.skill.name} proficiency={s.proficiency} status={s.status} action={
        <span className="flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button className="rounded-md p-1 text-slate-400 hover:text-brand-600" onClick={() => setEditing(s)} aria-label={`Edit ${s.skill.name}`}><Pencil className="size-3.5" /></button>
          <button className="rounded-md p-1 text-slate-400 hover:text-rose-600" onClick={() => setDeleting(s)} aria-label={`Remove ${s.skill.name}`}><Trash2 className="size-3.5" /></button>
        </span>
      } />
      {s.evidence && <p className="mt-1 text-xs text-slate-400">{s.evidence}</p>}
    </div>
  );

  return (
    <>
      <PageHeader title="Skills" subtitle="Verified skills are backed by an institution-approved credential. Everything else is self-reported." actions={<Button icon={Plus} onClick={() => setEditing('new')}>Add skill</Button>} />
      <Async state={state} empty={(d) => !d.student.skills.length} emptyProps={{ icon: Sparkles, title: 'No skills yet', message: 'Add your first skill to start getting matched with opportunities.', action: <Button icon={Plus} onClick={() => setEditing('new')}>Add skill</Button> }}>
        {({ student }) => {
          const verified = student.skills.filter((s) => s.status === 'VERIFIED');
          const self = student.skills.filter((s) => s.status !== 'VERIFIED');
          return (
            <>
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-900">
                <Info className="mt-0.5 size-5 shrink-0 text-brand-500" />
                <p>Want a skill verified? <Link to="/student/credentials" className="font-semibold underline">Submit a credential</Link> that covers it. Once your institution approves, the skill becomes <strong>Verified</strong> and counts more in matching.</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5">
                  <SectionTitle><span className="flex items-center gap-2"><BadgeCheck className="size-5 text-emerald-500" />Verified skills <span className="text-sm font-normal text-slate-400">({verified.length})</span></span></SectionTitle>
                  <div className="space-y-5">{verified.length ? verified.map((s) => <Row key={s.id} s={s} />) : <p className="text-sm text-slate-400">None yet. Submit credentials to get verified.</p>}</div>
                </Card>
                <Card className="p-5">
                  <SectionTitle><span className="flex items-center gap-2"><Sparkles className="size-5 text-slate-400" />Self-reported skills <span className="text-sm font-normal text-slate-400">({self.length})</span></span></SectionTitle>
                  <div className="space-y-5">{self.length ? self.map((s) => <Row key={s.id} s={s} />) : <p className="text-sm text-slate-400">All of your skills are verified.</p>}</div>
                </Card>
              </div>
            </>
          );
        }}
      </Async>
      {editing && <SkillModal skill={editing === 'new' ? null : editing} catalog={catalog.data?.skills ?? []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); state.reload(); }} />}
      <ConfirmDialog open={!!deleting} title="Remove skill?" message={`${deleting?.skill.name} will be removed from your profile.`} confirmLabel="Remove" onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}
