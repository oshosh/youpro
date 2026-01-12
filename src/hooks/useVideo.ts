import { useQuery } from '@tanstack/react-query';
import pipedService from '../services/piped';
import type { VideoInfo, DownloadOption } from '../types/video';

export function useVideo(videoId: string | undefined) {
  return useQuery<VideoInfo>({
    queryKey: ['video', videoId],
    queryFn: () => pipedService.getVideo(videoId!),
    enabled: !!videoId,
    staleTime: 1000 * 60 * 5, // 5분
    retry: 2,
  });
}

export function useDownloadOptions(video: VideoInfo | undefined): DownloadOption[] {
  if (!video) return [];
  return pipedService.getDownloadOptions(video);
}

export default useVideo;
