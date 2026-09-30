import { useState } from 'react';
import { Button, Field, Modal, Textarea } from './ui';

export default function ApplyModal({ opp, onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!opp) return null;
  const submit = async () => {
    setBusy(true);
    const ok = await onSubmit(opp, note.trim() || null);
    setBusy(false);
    if (ok) { setNote(''); onClose(); }
  };
  return (
    <Modal
      open onClose={onClose} title={`Apply to ${opp.title}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={submit}>Submit application</Button></>}
    >
      <div className="mb-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
        Your SkillBridge profile, verified credentials{opp.match ? ` and ${opp.match.score}% match score` : ''} are shared with <strong>{opp.organization}</strong>.
      </div>
      <Field label="Cover note (optional)" hint="A sentence or two on why you're a great fit.">
        {(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="I'd love to contribute because…" />}
      </Field>
    </Modal>
  );
}
