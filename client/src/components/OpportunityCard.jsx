import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Calendar, Check, MapPin, Wallet } from 'lucide-react';
import { Badge, Button, Card, MatchRing } from './ui';
import { APP_STATUS, OPP_TYPES, WORK_MODES, cn, daysLeft } from '../utils/format';

const STATUS_TONE = { APPLIED: 'blue', UNDER_REVIEW: 'amber', SHORTLISTED: 'violet', INTERVIEW: 'violet', REJECTED: 'red', SELECTED: 'green' };
export const AppStatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || 'slate'}>{APP_STATUS[status] || status}</Badge>;

export default function OpportunityCard({ opp, onSave, onApply, basePath = '/student/opportunities', compact }) {
  const closing = new Date(opp.deadline) - Date.now() < 3 * 86400000;
  return (
    <Card hover className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge tone="blue">{OPP_TYPES[opp.type]}</Badge>
            <Badge tone="slate">{WORK_MODES[opp.workMode]}</Badge>
          </div>
          <Link to={`${basePath}/${opp.id}`} className="block text-lg font-bold leading-snug text-slate-900 hover:text-brand-600">{opp.title}</Link>
          <p className="mt-0.5 text-sm font-medium text-slate-500">{opp.organization}</p>
        </div>
        {opp.match && <MatchRing score={opp.match.score} />}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1"><MapPin className="size-3.5" />{opp.location}</span>
        {opp.compensation && <span className="flex items-center gap-1"><Wallet className="size-3.5" />{opp.compensation}</span>}
        <span className={cn('flex items-center gap-1', closing && 'font-semibold text-rose-600')}><Calendar className="size-3.5" />{daysLeft(opp.deadline)}</span>
      </div>

      {opp.match && !compact && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {opp.match.matched.map((m) => (
            <span key={m.name} className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', m.source === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')} title={m.source}>
              <Check className="size-3" />{m.name}
            </span>
          ))}
          {opp.match.missing.map((m) => <span key={m} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700" title="Missing skill">✕ {m}</span>)}
        </div>
      )}
      {!opp.match && !compact && (
        <div className="mt-4 flex flex-wrap gap-1.5">{opp.skills.map((s) => <span key={s.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{s.name}</span>)}</div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-5">
        {opp.applicationStatus
          ? <div className="flex flex-1 items-center gap-2"><span className="text-xs text-slate-500">Your application:</span><AppStatusBadge status={opp.applicationStatus} /></div>
          : onApply && <Button size="sm" className="flex-1" onClick={() => onApply(opp)}>Apply now</Button>}
        <Link to={`${basePath}/${opp.id}`}><Button size="sm" variant="secondary">Details</Button></Link>
        {onSave && (
          <button onClick={() => onSave(opp)} className={cn('rounded-xl border p-2 transition-colors', opp.saved ? 'border-brand-200 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-400 hover:text-brand-600')} aria-label={opp.saved ? 'Remove from saved' : 'Save opportunity'} aria-pressed={opp.saved}>
            {opp.saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </button>
        )}
      </div>
    </Card>
  );
}
