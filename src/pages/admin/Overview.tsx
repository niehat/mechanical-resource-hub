import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { getDashboardStats, searchResources } from '../../lib/api';
import { ErrorState, PageLoader } from '../../components/ui';
import { ResourceCard } from '../../components/ResourceCard';

export default function Overview() {
  const stats = useAsync(getDashboardStats, []);
  const recent = useAsync(() => searchResources({ sort: 'newest', pageSize: 5 }), []);

  const cards = stats.data
    ? [
        { label: 'Semesters', value: stats.data.semesters },
        { label: 'Subjects', value: stats.data.subjects },
        { label: 'Uploaded resources', value: stats.data.resources },
        { label: 'Assignments', value: stats.data.assignments },
        { label: 'Reference books', value: stats.data.reference_books },
        { label: 'Study materials', value: stats.data.study_materials },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">Overview</h1>
        <Link to="/admin/upload" className="btn btn-primary"><Upload className="h-4 w-4" aria-hidden /> Upload new resource</Link>
      </div>

      {stats.loading && !stats.data && <PageLoader />}
      {stats.error && <div className="mt-6"><ErrorState message={stats.error} onRetry={stats.reload} /></div>}
      {cards.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="card p-5">
              <dd className="font-serif text-4xl font-semibold text-navy-900">{c.value}</dd>
              <dt className="mt-1 text-sm text-slate-600">{c.label}</dt>
            </div>
          ))}
        </dl>
      )}

      <h2 className="mt-10 text-xl font-semibold">Recently uploaded</h2>
      <div className="mt-4 space-y-3">
        {recent.error && <ErrorState message={recent.error} onRetry={recent.reload} />}
        {recent.data && recent.data.rows.length === 0 && <p className="text-sm text-slate-600">Nothing has been uploaded yet. Add subjects first, then upload your first PDF.</p>}
        {recent.data?.rows.map((r) => <ResourceCard key={r.id} resource={r} showContext />)}
      </div>
    </div>
  );
}
