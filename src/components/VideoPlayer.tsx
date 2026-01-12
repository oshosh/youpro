import { useState, useRef, useMemo } from 'react';
import type { VideoInfo } from '../types/video';

interface VideoPlayerProps {
  video: VideoInfo;
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // 영상+오디오가 결합된 스트림만 추출 (videoOnly: false)
  // 이것들만 바로 재생 가능 (보통 360p, 720p)
  const qualityOptions = useMemo(() => {
    const streams = video.videoStreams || [];
    
    // videoOnly가 false인 것만 (영상+오디오 결합된 스트림)
    const combinedStreams = streams.filter((s) => !s.videoOnly && s.height && s.height > 0);
    
    // 고유한 해상도만 추출 (중복 제거)
    const uniqueQualities = new Map<number, { quality: string; height: number; itag?: string }>();
    
    combinedStreams.forEach((s) => {
      const height = s.height || 0;
      if (!uniqueQualities.has(height)) {
        uniqueQualities.set(height, {
          quality: `${height}p`,
          height: height,
          itag: s.itag,
        });
      }
    });
    
    // 해상도 순으로 정렬 (높은 것부터)
    return Array.from(uniqueQualities.values()).sort((a, b) => b.height - a.height);
  }, [video.videoStreams]);

  // 선택된 품질 (기본값: 720p 또는 가장 가까운 것)
  const [selectedQuality, setSelectedQuality] = useState<string>('720p');
  
  const currentQuality = useMemo(() => {
    const found = qualityOptions.find((q) => q.quality === selectedQuality);
    if (found) return found;
    // 720p가 없으면 가장 가까운 것 선택
    const closest = qualityOptions.find((q) => q.height <= 720) || qualityOptions[0];
    return closest;
  }, [qualityOptions, selectedQuality]);

  // 프록시 URL 생성 (서버를 통해 스트리밍)
  // quality 파라미터로 해상도 지정 - 서버에서 download({ type: 'video+audio' })로 합쳐줌
  const proxyUrl = useMemo(() => {
    if (!video.videoId) return '';
    const quality = currentQuality?.quality || '720p';
    return `/api/proxy/${video.videoId}?quality=${encodeURIComponent(quality)}`;
  }, [video.videoId, currentQuality]);

  // HLS 스트림 사용 가능 여부
  const hlsUrl = video.hlsUrl;

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 재생/일시정지 토글
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // 전체 화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 시크
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 볼륨 조절
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  // 품질 변경
  const handleQualityChange = (quality: string) => {
    const currentTimeValue = videoRef.current?.currentTime || 0;
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    
    // 비디오 로드 후 이전 재생 위치로 이동
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTimeValue;
        if (isPlaying) videoRef.current.play();
      }
    }, 500);
  };

  // 현재 품질 라벨
  const currentQualityLabel = currentQuality?.quality || 'Auto';

  // 썸네일 URL (프록시 사용)
  const thumbnailUrl = `/vi/${video.videoId}/maxresdefault.jpg`;

  return (
    <div 
      className="relative aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={hlsUrl || proxyUrl}
        className="w-full h-full"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        poster={thumbnailUrl}
        playsInline
      />

      {/* 컨트롤 오버레이 */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* 중앙 재생 버튼 */}
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[var(--color-primary)]/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
        >
          {isPlaying ? (
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* 하단 컨트롤바 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* 프로그레스 바 */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--color-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-primary) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`,
              }}
            />
          </div>

          {/* 컨트롤 버튼들 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 재생/일시정지 */}
              <button onClick={togglePlay} className="p-1 hover:text-[var(--color-primary)] transition-colors">
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* 볼륨 */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setVolume(volume === 0 ? 1 : 0)}
                  className="p-1 hover:text-[var(--color-primary)] transition-colors"
                >
                  {volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              {/* 시간 표시 */}
              <span className="text-xs text-white/80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* 품질 선택 */}
              {qualityOptions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="p-1 hover:text-[var(--color-primary)] transition-colors text-xs font-medium"
                  >
                    {currentQualityLabel}
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-[var(--color-bg-dark)]/95 rounded-lg py-2 min-w-[120px] backdrop-blur-sm">
                      {qualityOptions.map((q, idx) => (
                        <button
                          key={`${q.quality}-${idx}`}
                          onClick={() => handleQualityChange(q.quality)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                            q.quality === currentQuality?.quality ? 'text-[var(--color-primary)]' : ''
                          }`}
                        >
                          {q.quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 전체 화면 */}
              <button onClick={toggleFullscreen} className="p-1 hover:text-[var(--color-primary)] transition-colors">
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
