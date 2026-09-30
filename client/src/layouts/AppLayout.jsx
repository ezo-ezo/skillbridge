import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Bell, BookmarkCheck, Briefcase, CheckCheck, ClipboardList, FileBadge, FolderKanban, GraduationCap,
  LayoutDashboard, LogOut, Menu, PlusSquare, Search, Settings, ShieldCheck, Sparkles, UserRound, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import Logo from '../components/Logo';
import { Avatar } from '../components/ui';
import { cn, timeAgo } from '../utils/format';

const NAV = {
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/profile', label: 'My Profile', icon: UserRound },
    { to: '/student/skills', label: 'Skills', icon: Sparkles },
    { to: '/student/projects', label: 'Projects', icon: FolderKanban },
    { to: '/student/credentials', label: 'Credentials', icon: FileBadge },
    { to: '/student/opportunities', label: 'Opportunities', icon: Search },
    { to: '/student/applications', label: 'My Applications', icon: ClipboardList },
    { to: '/student/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  INSTITUTION: [
    { to: '/institution', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/institution/verification', label: 'Verification Center', icon: ShieldCheck },
    { to: '/institution/students', label: 'Students', icon: GraduationCap },
    { to: '/institution/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  EMPLOYER: [
    { to: '/employer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/employer/candidates', label: 'Find Talent', icon: Users },
    { to: '/employer/opportunities', label: 'My Opportunities', icon: Briefcase },
    { to: '/employer/opportunities/new', label: 'Post Opportunity', icon: PlusSquare },
    { to: '/employer/applications', label: 'Applications', icon: ClipboardList },
    { to: '/employer/analytics', label: 'Analytics', icon: BarChart3 },
  ],
};
const ROLE_LABEL = { STUDENT: 'Student', INSTITUTION: 'Institution', EMPLOYER: 'Employer' };

function SidebarContent({ role, onNavigate }) {
  const items = NAV[role];
  const base = `/${role.toLowerCase()}`;
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6"><Logo dark to={base} /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              isActive ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {({ isActive }) => (<><Icon className={cn('size-[18px]', isActive && 'text-brand-400')} />{label}</>)}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 px-3 pb-5">
        <NavLink to={`${base}/settings`} onClick={onNavigate} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium', isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
          <Settings className="size-[18px]" /> Settings
        </NavLink>
      </div>
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { data, reload } = useFetch('/notifications');

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  useEffect(() => { if (open) reload(); }, [open, reload]);

  const unread = data?.unread ?? 0;
  const markAll = async () => { await api.put('/notifications/all/read'); reload(); };
  const openOne = async (n) => {
    if (!n.read) await api.put(`/notifications/${n.id}/read`);
    setOpen(false);
    reload();
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-brand-600"><CheckCheck className="size-3.5" /> Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!data?.notifications?.length && <p className="px-4 py-8 text-center text-sm text-slate-400">You're all caught up.</p>}
              {data?.notifications?.map((n) => (
                <button key={n.id} onClick={() => openOne(n)} className={cn('block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50', !n.read && 'bg-brand-50/50')}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [location.pathname]);

  const signOut = () => { logout(); navigate('/', { replace: true }); };

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(68,121,245,0.25),transparent_55%)]" />
        <div className="relative h-full"><SidebarContent role={user.role} /></div>
      </aside>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-navy-950/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside className="relative h-full w-72 bg-navy-900" initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }} transition={{ type: 'tween', duration: 0.22 }}>
              <button className="absolute right-3 top-4 rounded-lg p-2 text-slate-400" onClick={() => setDrawer(false)} aria-label="Close menu"><X className="size-5" /></button>
              <SidebarContent role={user.role} onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu className="size-5" /></button>
            <div className="lg:hidden"><Logo to={`/${user.role.toLowerCase()}`} /></div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'STUDENT' && user.profile?.username && (
              <NavLink to={`/profile/${user.profile.username}`} target="_blank" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:flex">
                <BookmarkCheck className="size-4" /> Public profile
              </NavLink>
            )}
            <NotificationBell />
            <div className="ml-1 flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
              <div className="hidden leading-tight sm:block">
                <p className="max-w-40 truncate text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
              </div>
              <button onClick={signOut} className="rounded-xl p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Log out" title="Log out"><LogOut className="size-[18px]" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
