import { Link } from 'react-router-dom';
import { cn } from '../utils/format';

export function LogoMark({ className = 'size-9' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <path d="M6 21c4-9 8-9 10-3s6 6 10-3" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="6" cy="21" r="2" fill="#fff" />
      <circle cx="26" cy="15" r="2" fill="#fff" />
    </svg>
  );
}

export default function Logo({ to = '/', dark, className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className={cn('text-xl font-extrabold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>
        Skill<span className="text-brand-gradient">Bridge</span>
      </span>
    </Link>
  );
}
