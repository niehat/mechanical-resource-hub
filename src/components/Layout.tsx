import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Cog, LayoutDashboard, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'}`;

function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-navy-900 text-white shadow-card">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Cog className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-serif text-lg font-semibold leading-tight">
            Mechanical Academic
            <span className="block text-xs font-normal text-navy-200">Resource Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/search" className={linkClass}>
            <span className="flex items-center gap-1.5"><Search className="h-4 w-4" aria-hidden /> Search</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <span className="flex items-center gap-1.5"><LayoutDashboard className="h-4 w-4" aria-hidden /> Admin dashboard</span>
            </NavLink>
          )}
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 hover:bg-white/10 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="container-page flex flex-col gap-1 pb-4 md:hidden" aria-label="Mobile">
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/search" className={linkClass} onClick={() => setOpen(false)}>Search resources</NavLink>
          {isAdmin && <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>Admin dashboard</NavLink>}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { isAdmin } = useAuth();
  return (
    <footer className="border-t border-navy-100 bg-navy-50">
      <div className="container-page flex flex-col gap-2 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>Mechanical Academic Resource Hub. Free academic resources for Mechanical Engineering students.</p>
        {!isAdmin && (
          <Link to="/admin/login" className="text-navy-700 underline-offset-2 hover:underline">
            Administrator sign in
          </Link>
        )}
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
