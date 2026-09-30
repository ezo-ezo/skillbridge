export const cn = (...parts) => parts.flat().filter(Boolean).join(' ');

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-IN', opts) : '—';

export const fmtMonthYear = (d) => fmtDate(d, { month: 'short', year: 'numeric' });

export function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const steps = [[60, 'm'], [3600, 'h'], [86400, 'd'], [2592000, 'mo']];
  let out = `${s}s`;
  for (const [sec, label] of steps) if (s >= sec) out = `${Math.floor(s / sec)}${label}`;
  return `${out} ago`;
}

export function daysLeft(d) {
  const n = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (n < 0) return 'Closed';
  if (n === 0) return 'Closes today';
  if (n === 1) return '1 day left';
  return `${n} days left`;
}

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const OPP_TYPES = {
  INTERNSHIP: 'Internship', JOB: 'Full-time job', HACKATHON: 'Hackathon',
  SCHOLARSHIP: 'Scholarship', COMPETITION: 'Competition', WORKSHOP: 'Workshop',
};
export const WORK_MODES = { REMOTE: 'Remote', ONSITE: 'On-site', HYBRID: 'Hybrid' };
export const CRED_TYPES = { CERTIFICATION: 'Certification', WORKSHOP: 'Workshop', HACKATHON: 'Hackathon', ACHIEVEMENT: 'Achievement' };
export const APP_STATUS = {
  APPLIED: 'Applied', UNDER_REVIEW: 'Under review', SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview', REJECTED: 'Rejected', SELECTED: 'Selected',
};

export const matchTone = (score) =>
  score >= 80 ? { text: 'text-emerald-600', bar: '#10b981', label: 'Excellent' }
    : score >= 60 ? { text: 'text-brand-600', bar: '#4479f5', label: 'Good' }
      : score >= 40 ? { text: 'text-amber-600', bar: '#f59e0b', label: 'Fair' }
        : { text: 'text-slate-500', bar: '#94a3b8', label: 'Low' };

// Only image/PDF uploads are served from the API host.
export const assetUrl = (u) => u || null;

export const errorMessage = (e) => e?.message || 'Something went wrong';
