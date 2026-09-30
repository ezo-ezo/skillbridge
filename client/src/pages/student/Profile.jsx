import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Camera, Eye, FileUp, Pencil, Plus, Trash2, Trophy, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { Async, Button, Card, ConfirmDialog, Field, Input, Modal, PageHeader, SectionTitle, TagInput, Textarea } from '../../components/ui';
import PortfolioView from '../../components/PortfolioView';
import { errorMessage, fmtMonthYear } from '../../utils/format';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function EditProfileModal({ student, onClose, onSaved }) {
  const [f, setF] = useState({
    name: student.name, headline: student.headline ?? '', bio: student.bio ?? '', collegeName: student.collegeName, degree: student.degree,
    branch: student.branch ?? '', graduationYear: student.graduationYear, location: student.location ?? '', interests: student.interests ?? [],
    githubUrl: student.githubUrl ?? '', linkedinUrl: student.linkedinUrl ?? '', portfolioUrl: student.portfolioUrl ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    setBusy(true); setErr('');
    try {
      await api.put('/students/me', { ...f, graduationYear: Number(f.graduationYear) });
      toast.success('Profile updated');
      onSaved();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Edit profile" wide footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save changes</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>{(id) => <Input id={id} value={f.name} onChange={set('name')} />}</Field>
        <Field label="Location">{(id) => <Input id={id} value={f.location} onChange={set('location')} placeholder="Bengaluru, KA" />}</Field>
        <div className="sm:col-span-2"><Field label="Headline">{(id) => <Input id={id} value={f.headline} onChange={set('headline')} placeholder="Full-stack developer who ships clean products" maxLength={150} />}</Field></div>
        <div className="sm:col-span-2"><Field label="Bio" hint="Shown on your public profile.">{(id) => <Textarea id={id} value={f.bio} onChange={set('bio')} maxLength={1500} />}</Field></div>
        <Field label="College" required>{(id) => <Input id={id} value={f.collegeName} onChange={set('collegeName')} />}</Field>
        <Field label="Degree" required>{(id) => <Input id={id} value={f.degree} onChange={set('degree')} />}</Field>
        <Field label="Branch / specialisation">{(id) => <Input id={id} value={f.branch} onChange={set('branch')} />}</Field>
        <Field label="Graduation year" required>{(id) => <Input id={id} type="number" value={f.graduationYear} onChange={set('graduationYear')} />}</Field>
        <div className="sm:col-span-2"><Field label="Interests" hint="Used to improve opportunity matching.">{() => <TagInput value={f.interests} onChange={(interests) => setF((x) => ({ ...x, interests }))} placeholder="e.g. Frontend, Machine Learning" />}</Field></div>
        <Field label="GitHub URL">{(id) => <Input id={id} value={f.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/you" />}</Field>
        <Field label="LinkedIn URL">{(id) => <Input id={id} value={f.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/you" />}</Field>
        <div className="sm:col-span-2"><Field label="Website / portfolio URL">{(id) => <Input id={id} value={f.portfolioUrl} onChange={set('portfolioUrl')} />}</Field></div>
      </div>
      {err && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{err}</p>}
    </Modal>
  );
}

// Add/edit form for achievements and experiences (they share most of their shape).
function RecordModal({ kind, record, onClose, onSaved }) {
  const isExp = kind === 'experience';
  const [f, setF] = useState(record ? {
    title: record.title, company: record.company ?? '', description: record.description ?? '',
    startDate: toDateInput(record.startDate), endDate: toDateInput(record.endDate), date: toDateInput(record.date),
  } : { title: '', company: '', description: '', startDate: '', endDate: '', date: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = isExp
        ? { title: f.title, company: f.company, description: f.description, startDate: f.startDate, endDate: f.endDate }
        : { title: f.title, description: f.description, date: f.date };
      const path = isExp ? '/experiences' : '/achievements';
      if (record) await api.put(`${path}/${record.id}`, body); else await api.post(path, body);
      toast.success(`${isExp ? 'Experience' : 'Achievement'} ${record ? 'updated' : 'added'}`);
      onSaved();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`${record ? 'Edit' : 'Add'} ${isExp ? 'experience' : 'achievement'}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></>}>
      <div className="space-y-4">
        <Field label={isExp ? 'Role' : 'Title'} required>{(id) => <Input id={id} value={f.title} onChange={set('title')} />}</Field>
        {isExp && <Field label="Company" required>{(id) => <Input id={id} value={f.company} onChange={set('company')} />}</Field>}
        {isExp ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" required>{(id) => <Input id={id} type="date" value={f.startDate} onChange={set('startDate')} />}</Field>
            <Field label="End" hint="Leave blank if current">{(id) => <Input id={id} type="date" value={f.endDate} onChange={set('endDate')} />}</Field>
          </div>
        ) : <Field label="Date">{(id) => <Input id={id} type="date" value={f.date} onChange={set('date')} />}</Field>}
        <Field label="Description">{(id) => <Textarea id={id} rows={3} value={f.description} onChange={set('description')} />}</Field>
      </div>
      {err && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{err}</p>}
    </Modal>
  );
}

export default function Profile() {
  const { user, refresh } = useAuth();
  const state = useFetch('/students/me');
  const [editing, setEditing] = useState(false);
  const [record, setRecord] = useState(null); // { kind, record? }
  const [deleting, setDeleting] = useState(null);
  const photoRef = useRef(null);
  const resumeRef = useRef(null);

  const reloadAll = () => { state.reload(); refresh(); };

  const upload = async (file, path, label) => {
    if (!file) return;
    try { await api.upload(path, file); toast.success(`${label} uploaded`); reloadAll(); } catch (e) { toast.error(errorMessage(e)); }
  };

  const remove = async () => {
    try {
      await api.del(`/${deleting.kind === 'experience' ? 'experiences' : 'achievements'}/${deleting.id}`);
      toast.success('Removed');
      setDeleting(null);
      state.reload();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader
        title="My Profile" subtitle="This is your living portfolio. Employers see verified items only."
        actions={<>
          <Link to={`/profile/${user.profile.username}`} target="_blank"><Button variant="secondary" icon={Eye}>View public page</Button></Link>
          <Button icon={Pencil} onClick={() => setEditing(true)}>Edit profile</Button>
        </>}
      />
      <input ref={photoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload(e.target.files[0], '/students/me/avatar', 'Photo')} />
      <input ref={resumeRef} type="file" accept="application/pdf" hidden onChange={(e) => upload(e.target.files[0], '/students/me/resume', 'Resume')} />

      <Async state={state} label="Loading your profile…">
        {({ student }) => (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={Camera} onClick={() => photoRef.current.click()}>Change photo</Button>
              <Button variant="secondary" size="sm" icon={FileUp} onClick={() => resumeRef.current.click()}>{student.resumeUrl ? 'Replace resume' : 'Upload resume (PDF)'}</Button>
            </div>
            <PortfolioView student={student} showPrivate />

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {[
                { kind: 'experience', title: 'Manage experience', icon: Briefcase, items: student.experiences, sub: (e) => `${e.company} · ${fmtMonthYear(e.startDate)} – ${e.endDate ? fmtMonthYear(e.endDate) : 'Present'}` },
                { kind: 'achievement', title: 'Manage achievements', icon: Trophy, items: student.achievements, sub: (a) => a.description || '' },
              ].map((g) => (
                <Card key={g.kind} className="p-5">
                  <SectionTitle action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setRecord({ kind: g.kind })}>Add</Button>}>{g.title}</SectionTitle>
                  {g.items.length === 0 && <p className="py-4 text-sm text-slate-400">Nothing added yet.</p>}
                  <ul className="divide-y divide-slate-100">
                    {g.items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{it.title}</p><p className="truncate text-xs text-slate-500">{g.sub(it)}</p></div>
                        <div className="flex shrink-0 gap-1">
                          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" onClick={() => setRecord({ kind: g.kind, record: it })} aria-label="Edit"><Pencil className="size-4" /></button>
                          <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleting({ kind: g.kind, id: it.id, title: it.title })} aria-label="Delete"><Trash2 className="size-4" /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            {editing && <EditProfileModal student={student} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reloadAll(); }} />}
            {record && <RecordModal kind={record.kind} record={record.record} onClose={() => setRecord(null)} onSaved={() => { setRecord(null); state.reload(); }} />}
            <ConfirmDialog open={!!deleting} title="Remove this item?" message={`“${deleting?.title}” will be removed from your portfolio.`} confirmLabel="Remove" onConfirm={remove} onCancel={() => setDeleting(null)} />
          </>
        )}
      </Async>
    </>
  );
}
