import { Suspense, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen, ClipboardList, Cog, FileText, Files, Folder, GraduationCap, Layers, LayoutDashboard,
  ListChecks, LogOut, Menu, Upload, UserRound, X, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui';
import { useTitle } from '../../hooks/useTitle';

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/semesters', label: 'Manage semesters', icon: Layers },
  { to: '/admin/subjects', label: 'Manage subjects', icon: GraduationCap },
  { to: '/admin/teachers', label: 'Teachers and course info', icon: UserRound },
  { to: '/admin/resources', label: 'Manage resources', icon: Files },
  { to: '/admin/upload', label: 'Upload new resource', icon: Upload },
  { to: '/admin/assignments', label: 'Manage assignments', icon: ClipboardList },
  { to: '/admin/suggestions', label: 'Manage suggestions', icon: ListChecks },
  { to: '/admin/reference-books', label: 'Manage reference books', icon: BookOpen },
  { to: '/admin/study-materials', label: 'Manage study materials', icon: FileText },
  { to: '/admin/other-documents', label: 'Manage other documents', icon: Folder },
];

export default function AdminLayout() {
  useTitle('Admin dashboard | Mechanical Academic Resource Hub');
  const { user, isAdmin, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (loading) return <PageLoader label="Checking access" />;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const navList = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-navy-100 hover:bg-white/10'}`
          }
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden /> {label}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-3 flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-navy-100 hover:bg-white/10"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden /> Log out
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-navy-50/60 lg:flex">
      <aside className="hidden w-64 shrink-0 bg-navy-900 p-4 text-white lg:block">
        <Link to="/" className="mb-6 flex items-center gap-2.5 px-2 pt-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600"><Cog className="h-5 w-5" aria-hidden /></span>
          <span className="font-serif text-base font-semibold leading-tight">Resource Hub<span className="block font-sans text-xs font-normal text-navy-200">Admin dashboard</span></span>
        </Link>
        {navList}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-navy-900 px-4 text-white lg:hidden">
          <span className="font-serif font-semibold">Admin dashboard</span>
          <button type="button" className="rounded-lg p-2 hover:bg-white/10" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>
        {open && <div className="bg-navy-900 px-4 pb-4 lg:hidden">{navList}</div>}

        <div className="flex items-center justify-between gap-3 border-b border-navy-100 bg-white px-4 py-3 text-sm sm:px-8">
          <span className="truncate text-slate-600">Signed in as <strong className="text-navy-900">{user.email}</strong></span>
          <Link to="/" className="shrink-0 font-medium text-brand-700 hover:underline">View public site</Link>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
