import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, Eye, GraduationCap, Layers, User } from 'lucide-react';
import type { Resource, ResourceDetail } from '../lib/types';
import { categoryMeta } from '../lib/constants';
import { formatBytes, formatDate } from '../lib/format';
import { publicUrl } from '../lib/api';
import { CategoryBadge, CategoryIcon } from './ui';

type Props = {
  resource: Resource | ResourceDetail;
  /** Show the subject and semester (used in search results and admin lists). */
  showContext?: boolean;
  actions?: ReactNode;
};

function isDetail(r: Resource | ResourceDetail): r is ResourceDetail {
  return 'subject_name' in r;
}

export function ResourceCard({ resource, showContext = false, actions }: Props) {
  const meta = categoryMeta(resource.category);
  const size = formatBytes(resource.file_size);
  return (
    <article className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600 sm:flex">
        <CategoryIcon category={resource.category} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-sans text-base font-semibold text-navy-900">{resource.title}</h3>
          <CategoryBadge category={resource.category} label={meta.label} />
        </div>
        {resource.author && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <User className="h-3.5 w-3.5" aria-hidden /> {resource.author}
          </p>
        )}
        {resource.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{resource.description}</p>}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
          {showContext && isDetail(resource) && (
            <>
              <Link to={`/semester/${resource.semester_number}/subject/${resource.subject_id}`} className="flex items-center gap-1.5 hover:text-brand-700">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden /> {resource.subject_name}
              </Link>
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" aria-hidden /> {resource.semester_name}
              </span>
            </>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" aria-hidden /> Uploaded {formatDate(resource.created_at)}
          </span>
          {size && <span>PDF, {size}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link to={`/resource/${resource.id}`} className="btn btn-primary btn-sm">
          <Eye className="h-4 w-4" aria-hidden /> Preview
        </Link>
        <a href={publicUrl(resource.file_path, resource.file_name)} className="btn btn-secondary btn-sm" download={resource.file_name}>
          <Download className="h-4 w-4" aria-hidden /> Download
        </a>
        {actions}
      </div>
    </article>
  );
}
