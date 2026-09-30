import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Link2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import Logo from '../components/Logo';
import PortfolioView from '../components/PortfolioView';
import { Async, Button, ErrorState } from '../components/ui';

export default function PublicProfile() {
  const { username } = useParams();
  const state = useFetch(`/profiles/${username}`);

  useEffect(() => { document.title = state.data ? `${state.data.student.name} — SkillBridge` : 'SkillBridge profile'; }, [state.data]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Profile link copied'); } catch { toast.error('Could not copy the link'); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex gap-2"><Button size="sm" variant="secondary" icon={Link2} onClick={copy}>Copy link</Button><Link to="/register"><Button size="sm">Build yours</Button></Link></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {state.error && state.error.toLowerCase().includes('not found')
          ? <ErrorState message="This profile doesn't exist or is private." />
          : (
            <Async state={state} label="Loading profile…">
              {({ student }) => (
                <>
                  <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <ShieldCheck className="size-5 shrink-0" />
                    <p>Only institution-verified credentials are shown as verified on this page. Private details are never displayed.</p>
                  </div>
                  <PortfolioView student={student} />
                </>
              )}
            </Async>
          )}
      </main>
    </div>
  );
}
