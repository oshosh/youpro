import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요..."
          className="w-full h-10 pl-4 pr-12 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />
        <button
          type="submit"
          className="absolute right-1 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-elevated)] hover:bg-[var(--color-primary)] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}

