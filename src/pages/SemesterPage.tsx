import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ClipboardList, FileText, Plus, UserRound } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { getSemesterByNumber, getSubjectsForSemester } from '../lib/api';
import { EmptyState, ErrorState, Modal, NotFoundPanel, PageLoader, Button } from '../components/ui';
import { SubjectForm } from '../components/SubjectForm';

export default function SemesterPage() {
  const { number } = useParams();
  const n = Number(number);
  const { isAdmin } = useAuth();
  const [adding, setAdding] = useState(false);

  const query = useAsync(async () => {
    if (!Number.isInteger(n) || n < 1 || n > 8) return null;
    const semester = await getSemesterByNumber(n);
    if (!semester) return null;
    const subjects = await getSubjectsForSemester(semester.id);
    return { semester, subjects };
  }, [n]);

  useTitle(query.data ? `${query.data.semester.name} | Mechanical Academic Resource Hub` : 'Semester | Mechanical Academic Resource Hub');

  if (query.loading && !query.data) return <PageLoader label="Loading subjects" />;
  if (query.error) return <div className="container-page py-10"><ErrorState message={query.error} onRetry={query.reload} /></div>;
  if (!query.data) return <NotFoundPanel title="Semester not found" text="Choose a semester from the home page." />;

  const { semester, subjects } = query.data;
  return (
    <div className="container-page py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <ChevronRight className="h-4 w-4" aria-hidden />
        <span className="text-navy-900">{semester.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{semester.name}</h1>
          <p className="mt-1 text-slate-600">{subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add subject
          </Button>
        )}
      </div>

      <div className="mt-8">
        {subjects.length === 0 ? (
          <EmptyState
            title="No subjects added yet"
            text={isAdmin ? 'Use "Add subject" to create the first subject for this semester.' : 'Subjects for this semester will appear here once the administrator adds them.'}
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <li key={s.id}>
                <Link to={`/semester/${semester.number}/subject/${s.id}`} className="card flex h-full flex-col p-5 transition-shadow hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-sans text-lg font-semibold">{s.name}</h2>
                    {s.code && <span className="shrink-0 rounded-md bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-800">{s.code}</span>}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {s.credit_hours != null ? `${s.credit_hours} credit hours` : 'Credit hours not set'}
                  </p>
                  <p className="mb-5 mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <UserRound className="h-4 w-4 shrink-0" aria-hidden /> {s.teacher_name ?? 'Teacher not assigned'}
                  </p>
                  <div className="mt-auto flex gap-5 border-t border-navy-100 pt-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4" aria-hidden /> {s.assignment_count} {s.assignment_count === 1 ? 'assignment' : 'assignments'}</span>
                    <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" aria-hidden /> {s.resource_count} {s.resource_count === 1 ? 'resource' : 'resources'}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={adding} title={`Add subject to ${semester.name}`} onClose={() => setAdding(false)}>
        <SubjectForm
          fixedSemesterId={semester.id}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            query.reload();
          }}
        />
      </Modal>
    </div>
  );
}
