import { useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, BadgeCheck, Clock, Inbox, Loader2, X, XCircle } from 'lucide-react';
import { cn, initials } from '../utils/format';

/* ---------- Buttons ---------- */
const BTN = {
  primary: 'bg-brand-gradient text-white shadow-sm hover:shadow-lift hover:brightness-110',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:border-brand-400 hover:text-brand-600',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  dark: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
};
const BTN_SIZE = { sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-4 py-2.5 text-sm gap-2', lg: 'px-6 py-3 text-base gap-2' };

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className, disabled, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:opacity-55 disabled:cursor-not-allowed active:scale-[0.98]',
        BTN[variant], BTN_SIZE[size], className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
      {children}
    </button>
  );
}

/* ---------- Surfaces ---------- */
export function Card({ className, hover, children, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-card', hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-900">{children}</h2>
      {action}
    </div>
  );
}

/* ---------- Badges ---------- */
const TONES = {
  slate: 'bg-slate-100 text-slate-600', blue: 'bg-brand-50 text-brand-700', green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700', red: 'bg-rose-50 text-rose-700', violet: 'bg-violet-50 text-violet-700',
};
export function Badge({ tone = 'slate', icon: Icon, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', TONES[tone], className)}>
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

// Credential / skill verification states. "Self-reported" is how unverified skills are shown.
export function VerifiedBadge({ status = 'VERIFIED', kind = 'credential', className }) {
  if (status === 'VERIFIED') return <Badge tone="green" icon={BadgeCheck} className={className}>✓ VERIFIED</Badge>;
  if (status === 'REJECTED') return <Badge tone="red" icon={XCircle} className={className}>REJECTED</Badge>;
  return kind === 'skill'
    ? <Badge tone="slate" className={className}>Self-reported</Badge>
    : <Badge tone="amber" icon={Clock} className={className}>PENDING</Badge>;
}

export function Avatar({ name, src, size = 'md', className }) {
  const dims = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl', xl: 'size-28 text-3xl' }[size];
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover ring-2 ring-white', dims, className)} />;
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-semibold text-white ring-2 ring-white', dims, className)} aria-label={name}>
      {initials(name)}
    </div>
  );
}

/* ---------- Progress / skill meters ---------- */
export function ProgressBar({ value, className, color = 'bg-brand-gradient', height = 'h-2.5' }) {
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-slate-100', height, className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className={cn('h-full rounded-full', color)} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
    </div>
  );
}

export function SkillBar({ name, proficiency, status, action }) {
  const verified = status === 'VERIFIED';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{name}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">{proficiency}%</span>
          <VerifiedBadge status={verified ? 'VERIFIED' : 'PENDING'} kind="skill" />
          {action}
        </span>
      </div>
      <ProgressBar value={proficiency} color={verified ? 'bg-emerald-500' : 'bg-slate-400'} height="h-2" />
    </div>
  );
}

export function MatchRing({ score, size = 64 }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#4479f5' : score >= 40 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8edf5" strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-sm font-bold text-slate-900">{score}%</span>
        <span className="mt-0.5 text-[9px] font-semibold tracking-wide text-slate-400">MATCH</span>
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = 'blue', children }) {
  const tones = { blue: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', violet: 'bg-violet-50 text-violet-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <Card className="p-5" hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && <div className={cn('rounded-xl p-2.5', tones[tone])}><Icon className="size-5" /></div>}
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
      {children}
    </Card>
  );
}

/* ---------- Async states ---------- */
export function Spinner({ className }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-500', className)} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <Spinner className="size-8" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-brand-50 p-4 text-brand-500"><Icon className="size-7" /></div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center" role="alert">
      <AlertTriangle className="mb-3 size-8 text-rose-500" />
      <h3 className="text-base font-semibold text-slate-900">Something went wrong</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

// Renders loading / error / empty / content for a useFetch result.
export function Async({ state, empty, emptyProps, children, label }) {
  if (state.loading && !state.data) return <PageLoader label={label} />;
  if (state.error && !state.data) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (empty && empty(state.data)) return <EmptyState {...emptyProps} />;
  return children(state.data);
}

/* ---------- Modal + confirm ---------- */
export function Modal({ open, onClose, title, children, wide, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cn('relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
            initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X className="size-5" /></button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, variant = 'danger' }) {
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } };
  return (
    <Modal
      open={open} onClose={onCancel} title={title}
      footer={<><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant={variant} loading={busy} onClick={run}>{confirmLabel}</Button></>}
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

/* ---------- Form controls ---------- */
export function Field({ label, error, hint, children, required }) {
  const id = useId();
  return (
    <div>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-500"> *</span>}</label>}
      {typeof children === 'function' ? children(id) : children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export const Input = ({ className, ...p }) => <input className={cn('field', className)} {...p} />;
export const Textarea = ({ className, rows = 4, ...p }) => <textarea rows={rows} className={cn('field resize-y', className)} {...p} />;
export const Select = ({ className, children, ...p }) => <select className={cn('field cursor-pointer', className)} {...p}>{children}</select>;

// Comma/enter separated tags (technologies, skills, interests).
export function TagInput({ value = [], onChange, placeholder = 'Type and press Enter', suggestions = [] }) {
  const [text, setText] = useState('');
  const add = (raw) => {
    const t = raw.trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText('');
  };
  const listId = useId();
  return (
    <div className="field flex min-h-11 flex-wrap items-center gap-1.5 !p-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
          {t}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label={`Remove ${t}`}><X className="size-3" /></button>
        </span>
      ))}
      <input
        list={listId} value={text} onChange={(e) => setText(e.target.value)} placeholder={value.length ? '' : placeholder}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)); }}
        onBlur={() => text && add(text)}
        className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-slate-400"
      />
      <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors', value === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
        >
          {t.label}{t.count != null && <span className="ml-1.5 text-xs text-slate-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-500' : 'bg-slate-300')}
    >
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function FadeIn({ children, delay = 0, className }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}>
      {children}
    </motion.div>
  );
}
