import { useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, FolderKanban, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Github } from '../../components/BrandIcons';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { Async, Badge, Button, ConfirmDialog, Field, Input, Modal, PageHeader, TagInput, Textarea } from '../../components/ui';
import { ProjectCardView } from '../../components/PortfolioView';
import { errorMessage, fmtMonthYear } from '../../utils/format';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function ProjectForm({ project, onClose, onSaved }) {
  const [f, setF] = useState({
    title: project?.title ?? '', description: project?.description ?? '', technologies: project?.technologies ?? [],
    githubUrl: project?.githubUrl ?? '', liveUrl: project?.liveUrl ?? '', imageUrl: project?.imageUrl ?? '',
    startDate: toDateInput(project?.startDate), endDate: toDateInput(project?.endDate), teamSize: project?.teamSize ?? 1,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const { url } = await api.upload('/uploads', file); setF((x) => ({ ...x, imageUrl: url })); } catch (e) { toast.error(errorMessage(e)); } finally { setUploading(false); }
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { ...f, teamSize: Number(f.teamSize) };
      if (project) await api.put(`/projects/${project.id}`, body); else await api.post('/projects', body);
      toast.success(project ? 'Project updated' : 'Project added');
      onSaved();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} wide title={project ? 'Edit project' : 'Add project'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>{project ? 'Save changes' : 'Add project'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Project title" required>{(id) => <Input id={id} value={f.title} onChange={set('title')} autoFocus />}</Field></div>
        <div className="sm:col-span-2"><Field label="Description" required>{(id) => <Textarea id={id} value={f.description} onChange={set('description')} maxLength={2000} />}</Field></div>
        <div className="sm:col-span-2"><Field label="Technologies" required>{() => <TagInput value={f.technologies} onChange={(technologies) => setF((x) => ({ ...x, technologies }))} placeholder="React, Node.js…" />}</Field></div>
        <Field label="GitHub URL">{(id) => <Input id={id} value={f.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/…" />}</Field>
        <Field label="Live URL">{(id) => <Input id={id} value={f.liveUrl} onChange={set('liveUrl')} placeholder="https://…" />}</Field>
        <Field label="Start date">{(id) => <Input id={id} type="date" value={f.startDate} onChange={set('startDate')} />}</Field>
        <Field label="End date">{(id) => <Input id={id} type="date" value={f.endDate} onChange={set('endDate')} />}</Field>
        <Field label="Team size">{(id) => <Input id={id} type="number" min={1} max={50} value={f.teamSize} onChange={set('teamSize')} />}</Field>
        <Field label="Project image" hint="PNG, JPG or WebP up to 5MB.">
          {(id) => (
            <div className="flex items-center gap-3">
              <input id={id} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadImage(e.target.files[0])} className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700" />
              {uploading && <span className="text-xs text-slate-400">Uploading…</span>}
              {f.imageUrl && !uploading && <img src={f.imageUrl} alt="Preview" className="size-10 rounded-lg object-cover" />}
            </div>
          )}
        </Field>
      </div>
      {err && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{err}</p>}
    </Modal>
  );
}

function ProjectView({ project, onClose, onEdit, onDelete }) {
  return (
    <Modal open onClose={onClose} wide title={project.title} footer={<><Button variant="ghost" icon={Trash2} className="mr-auto !text-rose-600" onClick={onDelete}>Delete</Button><Button variant="secondary" icon={Pencil} onClick={onEdit}>Edit</Button></>}>
      {project.imageUrl && <img src={project.imageUrl} alt="" className="mb-4 max-h-56 w-full rounded-2xl object-cover" />}
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{project.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{project.technologies.map((t) => <Badge key={t} tone="blue">{t}</Badge>)}</div>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-xs text-slate-400">Duration</dt><dd className="font-medium">{project.startDate ? fmtMonthYear(project.startDate) : '—'} – {project.endDate ? fmtMonthYear(project.endDate) : 'Ongoing'}</dd></div>
        <div><dt className="text-xs text-slate-400">Team</dt><dd className="flex items-center gap-1 font-medium"><Users className="size-4" />{project.teamSize}</dd></div>
      </dl>
      <div className="mt-5 flex gap-3">
        {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary" icon={Github}>Source</Button></a>}
        {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary" icon={ExternalLink}>Live demo</Button></a>}
      </div>
    </Modal>
  );
}

export default function Projects() {
  const state = useFetch('/students/me');
  const [mode, setMode] = useState(null); // {type:'form'|'view', project?}
  const [deleting, setDeleting] = useState(null);

  const remove = async () => {
    try { await api.del(`/projects/${deleting.id}`); toast.success('Project deleted'); setDeleting(null); setMode(null); state.reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Projects" subtitle="Show what you've built. Projects also count as evidence in opportunity matching." actions={<Button icon={Plus} onClick={() => setMode({ type: 'form' })}>Add project</Button>} />
      <Async state={state} empty={(d) => !d.student.projects.length} emptyProps={{ icon: FolderKanban, title: 'No projects yet', message: 'Add a project with its tech stack and links to bring your portfolio to life.', action: <Button icon={Plus} onClick={() => setMode({ type: 'form' })}>Add your first project</Button> }}>
        {({ student }) => (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {student.projects.map((p) => <ProjectCardView key={p.id} p={p} onClick={() => setMode({ type: 'view', project: p })} />)}
          </div>
        )}
      </Async>
      {mode?.type === 'form' && <ProjectForm project={mode.project} onClose={() => setMode(null)} onSaved={() => { setMode(null); state.reload(); }} />}
      {mode?.type === 'view' && <ProjectView project={mode.project} onClose={() => setMode(null)} onEdit={() => setMode({ type: 'form', project: mode.project })} onDelete={() => setDeleting(mode.project)} />}
      <ConfirmDialog open={!!deleting} title="Delete project?" message={`“${deleting?.title}” will be permanently deleted from your portfolio.`} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}
