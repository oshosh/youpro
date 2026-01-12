import { useTrending } from '../hooks/useTrending';
import VideoGrid from '../components/VideoGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Home() {
  const { data: videos, isLoading, error, refetch } = useTrending('KR');

  return (
    <div className="space-y-6">
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="영상을 불러오는 중..." />
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <ErrorMessage
          message="영상을 불러올 수 없습니다. 잠시 후 다시 시도해주세요."
          onRetry={() => refetch()}
        />
      )}

      {/* 영상 그리드 */}
      {videos && videos.length > 0 && (
        <VideoGrid videos={videos} title="🔥 지금 뜨는 영상" />
      )}

      {/* 빈 상태 */}
      {videos && videos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[var(--color-text-secondary)]">
            표시할 영상이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
