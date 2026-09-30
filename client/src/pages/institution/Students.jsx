import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Search } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { qs } from '../../services/api';
import { Async, Avatar, Badge, Card, Input, PageHeader, ProgressBar } from '../../components/ui';
import PortfolioView from '../../components/PortfolioView';

export function StudentsList() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const state = useFetch(`/institution/students${qs({ q: dq })}`);
  return (
    <>
      <PageHeader title="Students" subtitle="Track skill development, credential status and placements across your cohort." />
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input className="!pl-10" placeholder="Search by name or degree…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
      </div>
      <Async state={state} empty={(d) => !d.students.length} emptyProps={{ icon: GraduationCap, title: 'No students found', message: 'Students appear here once they register with your institution name.' }}>
        {({ students }) => (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-3 font-semibold">Student</th><th className="px-3 py-3 font-semibold">Profile</th><th className="px-3 py-3 font-semibold">Verified skills</th><th className="px-3 py-3 font-semibold">Credentials</th><th className="px-5 py-3 font-semibold">Placement</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <Link to={`/institution/students/${s.id}`} className="flex items-center gap-3">
                        <Avatar name={s.name} src={s.avatarUrl} size="sm" />
                        <span><span className="block font-semibold text-slate-900 hover:text-brand-600">{s.name}</span><span className="text-xs text-slate-500">{s.degree} · {s.graduationYear}</span></span>
                      </Link>
                    </td>
                    <td className="px-3 py-3"><div className="flex items-center gap-2"><ProgressBar value={s.completion} className="w-20" height="h-1.5" /><span className="text-xs text-slate-500">{s.completion}%</span></div></td>
                    <td className="px-3 py-3 text-slate-700">{s.verifiedSkills}<span className="text-slate-400"> / {s.skills}</span></td>
                    <td className="px-3 py-3">{s.credentials}{s.pending > 0 && <Badge tone="amber" className="ml-2">{s.pending} pending</Badge>}</td>
                    <td className="px-5 py-3">{s.placed ? <Badge tone="green">Placed · {s.placedAt}</Badge> : <span className="text-xs text-slate-400">Not placed</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </Async>
    </>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const state = useFetch(`/students/${id}`);
  return (
    <>
      <Link to="/institution/students" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"><ArrowLeft className="size-4" /> All students</Link>
      <Async state={state} label="Loading student…">{({ student }) => <PortfolioView student={student} showPrivate />}</Async>
    </>
  );
}
