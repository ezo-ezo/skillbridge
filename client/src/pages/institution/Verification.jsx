import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, ExternalLink, History, ShieldCheck, X } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../services/api';
import { Async, Avatar, Badge, Button, Card, Field, Modal, PageHeader, Tabs, Textarea, VerifiedBadge } from '../../components/ui';
import { CRED_TYPES, errorMessage, fmtDate, timeAgo } from '../../utils/format';

function RejectModal({ credential, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await api.post(`/verification/${credential.id}/reject`, { reason }); toast.success('Credential rejected'); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Reject credential" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" loading={busy} disabled={reason.trim().length < 3} onClick={submit}>Reject credential</Button></>}>
      <p className="mb-4 text-sm text-slate-600">You're rejecting <strong>{credential.title}</strong> from {credential.student.user.name}. The student will see your reason and can resubmit.</p>
      <Field label="Reason for rejection" required>{(id) => <Textarea id={id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="e.g. Certificate ID could not be confirmed with the issuer." autoFocus />}</Field>
    </Modal>
  );
}

function PendingCard({ c, onApprove, onReject, busy }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={c.student.user.name} src={c.student.user.avatarUrl} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{c.student.user.name}</p>
            <p className="text-xs text-slate-400">Submitted {timeAgo(c.createdAt)}</p>
          </div>
        </div>
        <Badge tone="violet">{CRED_TYPES[c.type]}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">{c.title}</h3>
      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-slate-400">Issuer</dt><dd className="font-medium text-slate-700">{c.issuer}</dd></div>
        <div><dt className="text-xs text-slate-400">Date</dt><dd className="font-medium text-slate-700">{fmtDate(c.issuedOn)}</dd></div>
        <div><dt className="text-xs text-slate-400">Credential ID</dt><dd className="font-mono text-xs font-medium text-slate-700">{c.credentialId || '—'}</dd></div>
      </dl>
      {c.skills.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5"><span className="text-xs text-slate-400">Will verify:</span>{c.skills.map((s) => <Badge key={s.id} tone="blue">{s.skill.name}</Badge>)}</div>}
      {c.description && <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{c.description}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {c.documentUrl ? <a href={c.documentUrl} target="_blank" rel="noreferrer"><Button variant="secondary" size="sm" icon={ExternalLink}>View document</Button></a> : <span className="text-xs text-slate-400">No document attached</span>}
        <Link to={`/institution/students/${c.student.id}`}><Button variant="ghost" size="sm">View profile</Button></Link>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" icon={X} className="!text-rose-600 hover:!border-rose-300" onClick={() => onReject(c)} disabled={busy}>Reject</Button>
          <Button variant="success" size="sm" icon={Check} loading={busy} onClick={() => onApprove(c)}>Verify</Button>
        </div>
      </div>
    </Card>
  );
}

export default function Verification() {
  const pending = useFetch('/verification/pending');
  const history = useFetch('/verification/history');
  const [tab, setTab] = useState('pending');
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refresh = () => { pending.reload(); history.reload(); };

  const approve = async (c) => {
    setBusyId(c.id);
    try { await api.post(`/verification/${c.id}/approve`); toast.success(`Verified “${c.title}”`); refresh(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusyId(null); }
  };

  return (
    <>
      <PageHeader title="Verification Center" subtitle="Review credentials submitted by your students. Verified items become publicly visible." />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ value: 'pending', label: 'Pending requests', count: pending.data?.credentials.length }, { value: 'history', label: 'History' }]} /></div>

      {tab === 'pending' ? (
        <Async state={pending} label="Loading requests…" empty={(d) => !d.credentials.length} emptyProps={{ icon: ShieldCheck, title: 'All caught up', message: 'There are no credentials waiting for verification.' }}>
          {({ credentials }) => (
            <div className="grid gap-4 xl:grid-cols-2">
              {credentials.map((c) => <PendingCard key={c.id} c={c} onApprove={approve} onReject={setRejecting} busy={busyId === c.id} />)}
            </div>
          )}
        </Async>
      ) : (
        <Async state={history} empty={(d) => !d.history.length} emptyProps={{ icon: History, title: 'No decisions yet', message: 'Verified and rejected credentials will appear here.' }}>
          {({ history: items }) => (
            <Card className="divide-y divide-slate-100">
              {items.map((h) => (
                <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{h.credential.title}</p>
                    <p className="text-xs text-slate-500">{h.credential.student.user.name} · {h.credential.issuer}</p>
                    {h.decision === 'REJECTED' && h.note && <p className="mt-1 text-xs text-rose-600">“{h.note}”</p>}
                  </div>
                  <div className="text-right"><VerifiedBadge status={h.decision} /><p className="mt-1 text-xs text-slate-400">by {h.verifier?.name ?? '—'} · {fmtDate(h.createdAt)}</p></div>
                </div>
              ))}
            </Card>
          )}
        </Async>
      )}
      {rejecting && <RejectModal credential={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); refresh(); }} />}
    </>
  );
}
