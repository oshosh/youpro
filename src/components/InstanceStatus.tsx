import { useInvidiousInstance } from '../hooks/useInvidiousInstance';

export default function InstanceStatus() {
  const { instanceUrl, isHealthy, isChecking, checkHealth } = useInvidiousInstance();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={checkHealth}
        disabled={isChecking}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-card)] rounded-lg text-xs hover:bg-[var(--color-bg-elevated)] transition-colors disabled:opacity-50"
        title={`현재 인스턴스: ${instanceUrl}`}
      >
        {/* 상태 표시등 */}
        <span
          className={`w-2 h-2 rounded-full ${
            isChecking
              ? 'bg-yellow-400 animate-pulse'
              : isHealthy
              ? 'bg-green-400'
              : 'bg-red-400'
          }`}
        />
        
        {/* 인스턴스 이름 */}
        <span className="text-[var(--color-text-secondary)] hidden sm:inline">
          {isChecking ? '확인 중...' : instanceUrl}
        </span>

        {/* 새로고침 아이콘 */}
        <svg
          className={`w-3 h-3 text-[var(--color-text-secondary)] ${isChecking ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
