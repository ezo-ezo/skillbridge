import { useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, ExternalLink, FileBadge, History, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { Async, Badge, Button, Card, ConfirmDialog, Field, Input, Modal, PageHeader, Select, Tabs, TagInput, Textarea, VerifiedBadge } from '../../components/ui';
import { CRED_TYPES, errorMessage, fmtDate, timeAgo } from '../../utils/format';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function VerificationHistory({ credential }) {
  return (
    <ol className="relative ml-2 space-y-3 border-l border-slate-200 pl-5">
      {credential.verifications.map((v) => (
        <li key={v.id} className="relative">
          <span className={`absolute -left-[26px] top-1 size-2.5 rounded-full ring-4 ring-white ${v.decision === 'VERIFIED' ? 'bg-emerald-500' : v.decision === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-400'}`} />
          <p className="text-sm font-medium text-slate-800">
            {v.decision === 'PENDING' ? 'Submitted' : v.decision === 'VERIFIED' ? 'Verified' : 'Rejected'}
            {v.verifier?.name && <span className="font-normal text-slate-500"> by {v.verifier.name}</span>}
          </p>
          <p className="text-xs text-slate-400">{fmtDate(v.createdAt)} · {timeAgo(v.createdAt)}</p>
          {v.note && v.decision !== 'PENDING' && <p className="mt-0.5 text-xs text-slate-500">“{v.note}”</p>}
        </li>
      ))}
    </ol>
  );
}

function CredentialForm({ credential, onClose, onSaved }) {
  const [f, setF] = useState({
    type: credential?.type ?? 'CERTIFICATION', title: credential?.title ?? '', issuer: credential?.issuer ?? '',
    issuedOn: toDateInput(credential?.issuedOn), credentialId: credential?.credentialId ?? '', documentUrl: credential?.documentUrl ?? '',
    description: credential?.description ?? '', skills: credential?.skills?.map((s) => s.skill.name) ?? [],
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const uploadDoc = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const { url } = await api.upload('/uploads', file); setF((x) => ({ ...x, documentUrl: url })); toast.success('Document attached'); } catch (e) { toast.error(errorMessage(e)); } finally { setUploading(false); }
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      if (credential) await api.put(`/credentials/${credential.id}`, f); else await api.post('/credentials', f);
      toast.success(credential ? 'Credential resubmitted for verification' : 'Credential submitted for verification');
      onSaved();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} wide title={credential ? 'Edit credential' : 'Submit a credential'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>{credential ? 'Save & resubmit' : 'Submit for verification'}</Button></>}>
      {credential && <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Saving changes sends this credential back to your institution for re-verification.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" required>{(id) => <Select id={id} value={f.type} onChange={set('type')}>{Object.entries(CRED_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
        <Field label="Date" required>{(id) => <Input id={id} type="date" value={f.issuedOn} onChange={set('issuedOn')} max={toDateInput(new Date())} />}</Field>
        <div className="sm:col-span-2"><Field label="Title" required>{(id) => <Input id={id} value={f.title} onChange={set('title')} placeholder="AWS Certified Cloud Practitioner" autoFocus />}</Field></div>
        <Field label="Issuer" required>{(id) => <Input id={id} value={f.issuer} onChange={set('issuer')} placeholder="Amazon Web Services" />}</Field>
        <Field label="Credential ID">{(id) => <Input id={id} value={f.credentialId} onChange={set('credentialId')} placeholder="ABC-123456" />}</Field>
        <div className="sm:col-span-2"><Field label="Skills this proves" hint="Verified credentials turn these skills into verified skills.">{() => <TagInput value={f.skills} onChange={(skills) => setF((x) => ({ ...x, skills }))} placeholder="e.g. AWS, Docker" />}</Field></div>
        <div className="sm:col-span-2">
          <Field label="Certificate / document" hint="PDF or image up to 5MB. Helps your institution verify faster.">
            {(id) => (
              <div className="flex flex-wrap items-center gap-3">
                <input id={id} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => uploadDoc(e.target.files[0])} className="block text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700" />
                {uploading && <span className="text-xs text-slate-400">Uploading…</span>}
                {f.documentUrl && !uploading && <a href={f.documentUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">View attached file</a>}
              </div>
            )}
          </Field>
        </div>
        <div className="sm:col-span-2"><Field label="Notes for the verifier">{(id) => <Textarea id={id} rows={2} value={f.description} onChange={set('description')} maxLength={1000} />}</Field></div>
      </div>
      {err && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{err}</p>}
    </Modal>
  );
}

function CredentialRow({ c, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap gap-1.5"><Badge tone="violet">{CRED_TYPES[c.type]}</Badge></div>
          <h3 className="font-semibold text-slate-900">{c.title}</h3>
          <p className="text-sm text-slate-500">{c.issuer} · {fmtDate(c.issuedOn)}{c.credentialId && <span className="ml-2 font-mono text-xs text-slate-400">#{c.credentialId}</span>}</p>
        </div>
        <VerifiedBadge status={c.status} />
      </div>
      {c.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{c.skills.map((s) => <span key={s.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s.skill.name}</span>)}</div>}
      {c.status === 'REJECTED' && c.rejectionReason && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700"><strong>Rejected:</strong> {c.rejectionReason}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600" aria-expanded={open}>
          <History className="size-3.5" /> Verification history <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex items-center gap-1">
          {c.documentUrl && <a href={c.documentUrl} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Open document"><ExternalLink className="size-4" /></a>}
          <button onClick={() => onEdit(c)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit"><Pencil className="size-4" /></button>
          <button onClick={() => onDelete(c)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><Trash2 className="size-4" /></button>
        </div>
      </div>
      {open && <div className="mt-4"><VerificationHistory credential={c} /></div>}
    </Card>
  );
}

export default function Credentials() {
  const state = useFetch('/credentials');
  const [tab, setTab] = useState('ALL');
  const [form, setForm] = useState(null); // {credential?}
  const [deleting, setDeleting] = useState(null);

  const remove = async () => {
    try { await api.del(`/credentials/${deleting.id}`); toast.success('Credential deleted'); setDeleting(null); state.reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Credentials" subtitle="Certifications, workshops, hackathons and achievements. Your institution verifies them." actions={<Button icon={Plus} onClick={() => setForm({})}>Submit credential</Button>} />
      <Async state={state} empty={(d) => !d.credentials.length} emptyProps={{ icon: FileBadge, title: 'No credentials yet', message: 'Submit a certificate and get it verified to earn a ✓ VERIFIED badge.', action: <Button icon={Plus} onClick={() => setForm({})}>Submit your first credential</Button> }}>
        {({ credentials }) => {
          const count = (s) => credentials.filter((c) => c.status === s).length;
          const shown = tab === 'ALL' ? credentials : credentials.filter((c) => c.status === tab);
          return (
            <>
              <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'ALL', label: 'All', count: credentials.length }, { value: 'VERIFIED', label: 'Verified', count: count('VERIFIED') }, { value: 'PENDING', label: 'Pending', count: count('PENDING') }, { value: 'REJECTED', label: 'Rejected', count: count('REJECTED') }]} /></div>
              <div className="grid gap-4 lg:grid-cols-2">
                {shown.map((c) => <CredentialRow key={c.id} c={c} onEdit={(x) => setForm({ credential: x })} onDelete={setDeleting} />)}
              </div>
              {!shown.length && <p className="py-10 text-center text-sm text-slate-400">No credentials with this status.</p>}
            </>
          );
        }}
      </Async>
      {form && <CredentialForm credential={form.credential} onClose={() => setForm(null)} onSaved={() => { setForm(null); state.reload(); }} />}
      <ConfirmDialog open={!!deleting} title="Delete credential?" message={`“${deleting?.title}” and its verification history will be deleted. Skills it backed become self-reported.`} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}
