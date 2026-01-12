import { useQuery } from '@tanstack/react-query';
import pipedService from '../services/piped';
import type { TrendingVideo } from '../types/video';

export function useTrending(region: string = 'KR') {
  return useQuery<TrendingVideo[]>({
    queryKey: ['trending', region],
    queryFn: () => pipedService.getTrending(region),
    staleTime: 1000 * 60 * 10, // 10분
    retry: 2,
  });
}

export default useTrending;
