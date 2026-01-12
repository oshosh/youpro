import { useQuery } from '@tanstack/react-query';
import pipedService from '../services/piped';
import type { VideoSearchResult } from '../types/video';

export function useSearch(query: string) {
  return useQuery<VideoSearchResult[]>({
    queryKey: ['search', query],
    queryFn: async () => {
      const { results } = await pipedService.search(query);
      return results;
    },
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2, // 2분
    retry: 2,
  });
}

// 무한 스크롤용 (현재는 단순 검색만 지원)
export function useInfiniteSearch(query: string) {
  return useQuery({
    queryKey: ['search-infinite', query],
    queryFn: async () => {
      return pipedService.search(query);
    },
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
}

export default useSearch;
