interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-[var(--color-primary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[var(--color-text-primary)] font-medium mb-1">
          오류가 발생했습니다
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-lg text-sm font-medium transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

