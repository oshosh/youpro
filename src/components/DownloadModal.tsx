import { useState } from 'react';
import type { VideoInfo, DownloadOption } from '../types/video';

interface DownloadModalProps {
  video: VideoInfo;
  options: DownloadOption[];
  onClose: () => void;
}

type FilterType = 'all' | 'combined' | 'video' | 'audio';

export default function DownloadModal({ video, options, onClose }: DownloadModalProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [downloading, setDownloading] = useState<string | null>(null);

  const filteredOptions = options.filter((opt) => {
    if (filter === 'all') return true;
    return opt.type === filter;
  });

  const handleDownload = async (option: DownloadOption) => {
    setDownloading(option.url);
    
    try {
      // 새 탭에서 다운로드 URL 열기
      const link = document.createElement('a');
      link.href = option.url;
      link.download = `${video.title}.${option.format}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const getTypeIcon = (type: DownloadOption['type']) => {
    switch (type) {
      case 'combined':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
          </svg>
        );
      case 'video':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        );
    }
  };

  const getTypeBadgeColor = (type: DownloadOption['type']) => {
    switch (type) {
      case 'combined':
        return 'bg-green-500/20 text-green-400';
      case 'video':
        return 'bg-blue-500/20 text-blue-400';
      case 'audio':
        return 'bg-purple-500/20 text-purple-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-[var(--color-bg-dark)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-display font-semibold mb-1">다운로드</h2>
              <p className="text-sm text-[var(--color-text-secondary)] truncate">
                {video.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--color-bg-elevated)] transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* 필터 탭 */}
          <div className="flex items-center gap-2 mt-4">
            {(['all', 'combined', 'video', 'audio'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'
                }`}
              >
                {f === 'all' && '전체'}
                {f === 'combined' && '영상+음성'}
                {f === 'video' && '영상만'}
                {f === 'audio' && '음성만'}
              </button>
            ))}
          </div>
        </div>

        {/* 다운로드 옵션 목록 */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)]">
                사용 가능한 다운로드 옵션이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOptions.map((option, index) => (
                <button
                  key={`${option.url}-${index}`}
                  onClick={() => handleDownload(option)}
                  disabled={downloading === option.url}
                  className="w-full flex items-center gap-3 p-3 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-elevated)] rounded-xl transition-colors text-left group disabled:opacity-50"
                >
                  {/* 아이콘 */}
                  <div className={`p-2 rounded-lg ${getTypeBadgeColor(option.type)}`}>
                    {getTypeIcon(option.type)}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {option.format.toUpperCase()}
                      {option.size && ` • ${option.size}`}
                    </p>
                  </div>

                  {/* 다운로드 아이콘 */}
                  <div className="shrink-0">
                    {downloading === option.url ? (
                      <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg 
                        className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]/50">
          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            💡 영상+음성 옵션을 선택하면 바로 재생 가능한 파일이 다운로드됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

