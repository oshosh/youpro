import { Link } from 'react-router-dom';
import type { VideoSearchResult, TrendingVideo } from '../types/video';

interface VideoCardProps {
  video: VideoSearchResult | TrendingVideo;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(1)}B`;
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// 썸네일 URL을 프록시 경로로 변환
function getProxyThumbnailUrl(videoId: string, originalUrl?: string): string {
  // 개발 환경에서는 항상 프록시 사용
  if (import.meta.env.DEV) {
    return `/api/ytimg/vi/${videoId}/mqdefault.jpg`;
  }
  return originalUrl || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export default function VideoCard({ video }: VideoCardProps) {
  const thumbnail = video.videoThumbnails?.[0];
  const thumbnailUrl = getProxyThumbnailUrl(video.videoId, thumbnail?.url);

  return (
    <Link 
      to={`/watch/${video.videoId}`}
      className="group block"
    >
      {/* 썸네일 */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--color-bg-card)]">
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            // 폴백: 다른 품질의 썸네일 시도
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('default.jpg')) {
              target.src = `/api/ytimg/vi/${video.videoId}/default.jpg`;
            }
          }}
        />
        {/* 재생시간 */}
        {video.lengthSeconds > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs font-medium">
            {formatDuration(video.lengthSeconds)}
          </div>
        )}
        {/* 라이브 배지 */}
        {video.liveNow && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[var(--color-primary)] rounded text-xs font-semibold">
            LIVE
          </div>
        )}
        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 bg-[var(--color-primary)]/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-200">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 정보 */}
      <div className="mt-3 flex gap-3">
        {/* 채널 아바타 플레이스홀더 */}
        <div className="w-9 h-9 rounded-full bg-[var(--color-bg-elevated)] shrink-0 flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
          {video.author.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
            {video.title}
          </h3>
          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
            <p className="truncate">{video.author}</p>
            <p className="flex items-center gap-1">
              <span>{formatViewCount(video.viewCount)} 조회수</span>
              <span>•</span>
              <span>{video.publishedText}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

