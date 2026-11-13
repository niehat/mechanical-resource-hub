import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { getDashboardStats, getSemesterOverview } from '../lib/api';
import { SearchBar } from '../components/SearchBar';
import { EmptyState, ErrorState, PageLoader } from '../components/ui';

export default function Home() {
  useTitle('Mechanical Academic Resource Hub');
  const stats = useAsync(getDashboardStats, []);
  const semesters = useAsync(getSemesterOverview, []);

  const items = [
    { label: 'Semesters', value: stats.data?.semesters },
    { label: 'Subjects', value: stats.data?.subjects },
    { label: 'PDF resources', value: stats.data?.resources },
    { label: 'Assignments', value: stats.data?.assignments },
    { label: 'Reference books', value: stats.data?.reference_books },
  ];

  return (
    <>
      <section className="blueprint text-white">
        <div className="container-page pb-10 pt-14 sm:pb-12 sm:pt-20">
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Books, notes, suggestions and assignments for every Mechanical Engineering semester
          </h1>
          <p className="mt-4 max-w-2xl text-base text-navy-100 sm:text-lg">
            Pick your semester, open a subject and read or download its PDFs. No account needed.
          </p>
          <div className="mt-8 max-w-2xl">
            <SearchBar />
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/15 sm:grid-cols-5">
            {items.map((item) => (
              <div key={item.label} className="bg-navy-900/80 px-4 py-4">
                <dd className="font-serif text-3xl font-semibold text-white">
                  {stats.loading && item.value === undefined ? '–' : item.value ?? '–'}
                </dd>
                <dt className="mt-0.5 text-xs text-navy-200">{item.label}</dt>
              </div>
            ))}
          </dl>
          {stats.error && <p className="mt-3 text-sm text-red-200" role="alert">Statistics are unavailable: {stats.error}</p>}
        </div>
      </section>

      <section className="container-page py-12" aria-labelledby="semesters-heading">
        <h2 id="semesters-heading" className="text-2xl font-semibold sm:text-3xl">Choose your semester</h2>
        <p className="mt-1 text-slate-600">Each semester lists its subjects and every resource uploaded for them.</p>

        <div className="mt-8">
          {semesters.loading && !semesters.data && <PageLoader label="Loading semesters" />}
          {semesters.error && <ErrorState message={semesters.error} onRetry={semesters.reload} />}
          {semesters.data && semesters.data.length === 0 && (
            <EmptyState title="No semesters yet" text="The administrator has not set up any semesters. Please check back soon." />
          )}
          {semesters.data && semesters.data.length > 0 && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {semesters.data.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/semester/${s.number}`}
                    className="card group flex h-full flex-col p-5 transition-shadow hover:shadow-lift"
                  >
                    <span className="font-serif text-5xl font-semibold leading-none text-brand-600">{s.number}</span>
                    <span className="mt-3 text-lg font-semibold text-navy-900">{s.name}</span>
                    <span className="mt-3 flex gap-5 text-sm text-slate-600">
                      <span><strong className="text-navy-900">{s.subject_count}</strong> {s.subject_count === 1 ? 'subject' : 'subjects'}</span>
                      <span><strong className="text-navy-900">{s.resource_count}</strong> {s.resource_count === 1 ? 'resource' : 'resources'}</span>
                    </span>
                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-medium text-brand-700">
                      View subjects
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
