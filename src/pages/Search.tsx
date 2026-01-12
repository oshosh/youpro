import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';
import VideoCard from '../components/VideoCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: videos, isLoading, error, refetch } = useSearch(query);

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-[var(--color-text-secondary)]"
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
        </div>
        <p className="text-[var(--color-text-secondary)]">
          검색어를 입력해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 검색 결과 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-semibold">
          <span className="text-[var(--color-text-secondary)]">검색 결과: </span>
          <span className="text-[var(--color-primary)]">"{query}"</span>
        </h1>
        {videos && videos.length > 0 && (
          <span className="text-sm text-[var(--color-text-secondary)]">
            {videos.length}개 영상
          </span>
        )}
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="검색 중... (yt-dlp 실행 중)" />
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <ErrorMessage
          message="검색 결과를 불러올 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요."
          onRetry={() => refetch()}
        />
      )}

      {/* 검색 결과 */}
      {videos && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video, index) => (
            <VideoCard key={`${video.videoId}-${index}`} video={video} />
          ))}
        </div>
      )}

      {/* 결과 없음 */}
      {!isLoading && videos && videos.length === 0 && query && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-[var(--color-text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-[var(--color-text-primary)] font-medium mb-1">
            검색 결과가 없습니다
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            다른 검색어로 시도해보세요
          </p>
        </div>
      )}
    </div>
  );
}
