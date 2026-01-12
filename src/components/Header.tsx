import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import InstanceStatus from './InstanceStatus';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-dark)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* 로고 */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
            You<span className="text-[var(--color-primary)]">Pro</span>
          </span>
        </Link>

        {/* 검색바 */}
        <div className="flex-1 max-w-2xl mx-auto">
          <SearchBar />
        </div>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-3 shrink-0">
          {/* 인스턴스 상태 */}
          <InstanceStatus />
        </div>
      </div>
    </header>
  );
}

