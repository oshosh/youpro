import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVideo, useDownloadOptions } from '../hooks/useVideo';
import VideoPlayer from '../components/VideoPlayer';
import VideoCard from '../components/VideoCard';
import DownloadModal from '../components/DownloadModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

function formatSubscribers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default function Watch() {
  const { videoId } = useParams<{ videoId: string }>();
  const { data: video, isLoading, error, refetch } = useVideo(videoId);
  const downloadOptions = useDownloadOptions(video);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" text="영상을 불러오는 중..." />
      </div>
    );
  }

  if (error || !video) {
    return (
      <ErrorMessage
        message="영상을 불러올 수 없습니다."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 메인 영역 */}
      <div className="lg:col-span-2 space-y-4">
        {/* 비디오 플레이어 */}
        <VideoPlayer video={video} />

        {/* 영상 정보 */}
        <div className="space-y-4">
          {/* 제목 */}
          <h1 className="text-xl font-display font-semibold leading-tight">
            {video.title}
          </h1>

          {/* 채널 및 액션 */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 채널 정보 */}
            <div className="flex items-center gap-3">
              {video.authorThumbnail ? (
                <img 
                  src={video.authorThumbnail} 
                  alt={video.author}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-sm font-semibold">
                  {video.author.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <Link
                  to={`/channel/${video.authorId}`}
                  className="font-medium hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                >
                  {video.author}
                  {video.authorVerified && (
                    <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </Link>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  구독자 {formatSubscribers(video.subscriberCount)}명
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              {/* 좋아요/싫어요 */}
              <div className="flex items-center bg-[var(--color-bg-card)] rounded-full overflow-hidden">
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--color-bg-elevated)] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                  </svg>
                  <span className="text-sm font-medium">{formatNumber(video.likeCount)}</span>
                </button>
                <div className="w-px h-6 bg-[var(--color-border)]" />
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--color-bg-elevated)] transition-colors">
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                  </svg>
                </button>
              </div>

              {/* 다운로드 버튼 */}
              <button
                onClick={() => setShowDownloadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                <span className="text-sm font-medium">다운로드</span>
              </button>
            </div>
          </div>

          {/* 조회수 및 날짜 */}
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <span>조회수 {formatNumber(video.viewCount)}회</span>
            <span>•</span>
            <span>{video.publishedText}</span>
          </div>

          {/* 설명 */}
          <div className="bg-[var(--color-bg-card)] rounded-xl p-4">
            <p
              className={`text-sm whitespace-pre-wrap ${
                isDescriptionExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {video.description}
            </p>
            {video.description && video.description.length > 200 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {isDescriptionExpanded ? '간략히' : '더보기'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 추천 영상 사이드바 */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold">추천 영상</h2>
        <div className="space-y-3">
          {video.recommendedVideos?.slice(0, 10).map((rec) => (
            <VideoCard key={rec.videoId} video={rec} />
          ))}
        </div>
      </div>

      {/* 다운로드 모달 */}
      {showDownloadModal && (
        <DownloadModal
          video={video}
          options={downloadOptions}
          onClose={() => setShowDownloadModal(false)}
        />
      )}
    </div>
  );
}
