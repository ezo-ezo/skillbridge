import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Avatar, Button, Card, Field, Input, PageHeader, SectionTitle, Toggle } from '../components/ui';
import { errorMessage } from '../utils/format';

export default function Settings() {
  const { user, refresh, logout } = useAuth();
  const student = useFetch('/students/me', { enabled: user.role === 'STUDENT' });
  const [name, setName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const photo = useRef(null);

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try { await api.put('/auth/me', { name }); await refresh(); toast.success('Name updated'); } catch (err) { toast.error(errorMessage(err)); } finally { setSavingName(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    setSavingPw(true);
    try {
      await api.put('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) { toast.error(errorMessage(err)); } finally { setSavingPw(false); }
    return undefined;
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    try { await api.upload('/users/me/avatar', file); await refresh(); toast.success('Photo updated'); } catch (err) { toast.error(errorMessage(err)); }
  };

  const togglePublic = async (value) => {
    student.setData((d) => ({ student: { ...d.student, isPublic: value } }));
    try { await api.put('/students/me', { isPublic: value }); toast.success(value ? 'Your profile is now public' : 'Your profile is now private'); } catch (err) { toast.error(errorMessage(err)); student.reload(); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account, security and privacy." />
      <div className="grid max-w-3xl gap-6">
        <Card className="p-6">
          <SectionTitle><span className="flex items-center gap-2"><UserRound className="size-5 text-brand-500" />Account</span></SectionTitle>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div>
              <input ref={photo} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => uploadPhoto(e.target.files[0])} />
              <Button variant="secondary" size="sm" icon={Camera} onClick={() => photo.current.click()}>Change photo</Button>
              <p className="mt-1 text-xs text-slate-400">PNG, JPG or WebP up to 5MB.</p>
            </div>
          </div>
          <form onSubmit={saveName} className="space-y-4">
            <Field label={user.role === 'INSTITUTION' ? 'Institution name' : 'Name'}>{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />}</Field>
            <Field label="Email">{(id) => <Input id={id} value={user.email} disabled />}</Field>
            <Button type="submit" loading={savingName} disabled={name === user.name}>Save changes</Button>
          </form>
        </Card>

        {user.role === 'STUDENT' && student.data && (
          <Card className="p-6">
            <SectionTitle><span className="flex items-center gap-2"><ShieldCheck className="size-5 text-brand-500" />Privacy</span></SectionTitle>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">Public profile</p>
                <p className="text-sm text-slate-500">Lets anyone view your portfolio at /profile/{user.profile.username} and lets employers find you. Only verified credentials are shown.</p>
              </div>
              <Toggle checked={student.data.student.isPublic} onChange={togglePublic} label="Public profile" />
            </div>
          </Card>
        )}

        <Card className="p-6">
          <SectionTitle><span className="flex items-center gap-2"><KeyRound className="size-5 text-brand-500" />Password</span></SectionTitle>
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Current password">{(id) => <Input id={id} type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" hint="At least 8 characters.">{(id) => <Input id={id} type="password" autoComplete="new-password" minLength={8} required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}</Field>
              <Field label="Confirm new password">{(id) => <Input id={id} type="password" autoComplete="new-password" minLength={8} required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />}</Field>
            </div>
            <Button type="submit" loading={savingPw}>Change password</Button>
          </form>
        </Card>

        <Card className="flex items-center justify-between gap-4 p-6">
          <div><p className="font-medium text-slate-900">Log out</p><p className="text-sm text-slate-500">Sign out of SkillBridge on this device.</p></div>
          <Button variant="danger" onClick={logout}>Log out</Button>
        </Card>
      </div>
    </>
  );
}
