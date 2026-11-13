import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <form onSubmit={submit} role="search" className="flex w-full overflow-hidden rounded-xl bg-white shadow-lift ring-1 ring-navy-100 focus-within:ring-2 focus-within:ring-brand-400">
      <label htmlFor="global-search" className="sr-only">Search resources</label>
      <Search className="my-auto ml-4 h-5 w-5 shrink-0 text-navy-400" aria-hidden />
      <input
        id="global-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search by subject, code, teacher, book or assignment"
        className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
      />
      <button type="submit" className="m-1.5 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700">
        Search
      </button>
    </form>
  );
}
