import axios, { type AxiosInstance } from 'axios';
import type {
  VideoInfo,
  VideoSearchResult,
  TrendingVideo,
  DownloadOption,
} from '../types/video';

// 로컬 백엔드 API (youtubei.js 기반)
const API_BASE = '/api';

class YouTubeService {
  private client: AxiosInstance;
  private currentName: string = 'youtubei.js (로컬)';

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 60000, // 60초 타임아웃 (InnerTube 초기화가 오래 걸릴 수 있음)
    });
  }

  getCurrentInstanceName(): string {
    return this.currentName;
  }

  // 헬스 체크
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 30000 });
      if (response.data?.status === 'ok') {
        this.currentName = 'youtubei.js (연결됨)';
        return true;
      }
      return false;
    } catch (error) {
      console.log('Health check failed:', error);
      this.currentName = 'youtubei.js (오프라인)';
      return false;
    }
  }

  // 조회수 포맷
  private formatViewCount(count: number): string {
    if (!count) return '0';
    if (count >= 1000000000) return `${(count / 1000000000).toFixed(1)}B`;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  // 영상 정보 가져오기
  async getVideo(videoId: string): Promise<VideoInfo> {
    const response = await this.client.get(`/video/${videoId}`);
    return response.data;
  }

  // 검색
  async search(query: string, page: number = 1): Promise<{ results: VideoSearchResult[]; nextpage: string }> {
    const response = await this.client.get('/search', {
      params: { q: query, page }
    });
    return response.data;
  }

  // 트렌딩 영상
  async getTrending(region: string = 'KR'): Promise<TrendingVideo[]> {
    const response = await this.client.get('/trending', {
      params: { region }
    });
    return response.data;
  }

  // 스트림 URL 가져오기
  async getStreamUrl(videoId: string, itag?: string): Promise<{ url: string; itag: string; quality: string }> {
    const response = await this.client.get(`/stream/${videoId}`, {
      params: itag ? { itag } : {}
    });
    return response.data;
  }

  // 다운로드 옵션 생성
  getDownloadOptions(video: VideoInfo): DownloadOption[] {
    const options: DownloadOption[] = [];

    // 결합된 스트림 (영상+오디오)
    video.videoStreams
      .filter(s => s.url && !s.videoOnly)
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .forEach(stream => {
        const quality = stream.quality || `${stream.height}p`;
        const format = stream.format || 'mp4';
        
        options.push({
          url: stream.url,
          quality,
          type: 'combined',
          format,
          label: `${quality} (${format}) - 영상+음성`,
        });
      });

    // 비디오만 스트림
    video.videoStreams
      .filter(s => s.url && s.videoOnly)
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .slice(0, 5)
      .forEach(stream => {
        const quality = stream.quality || `${stream.height}p`;
        const format = stream.format || 'webm';
        
        options.push({
          url: stream.url,
          quality,
          type: 'video',
          format,
          label: `${quality} (영상만, ${format})`,
        });
      });

    // 오디오 스트림
    video.audioStreams
      .filter(s => s.url)
      .sort((a, b) => b.bitrate - a.bitrate)
      .slice(0, 3)
      .forEach(stream => {
        const bitrate = `${Math.round(stream.bitrate / 1000)}kbps`;
        const format = stream.format || 'webm';
        
        options.push({
          url: stream.url,
          quality: bitrate,
          type: 'audio',
          format,
          label: `오디오 ${bitrate} (${format})`,
        });
      });

    return options;
  }

  // 썸네일 URL
  getThumbnailUrl(videoId: string): string {
    return `/vi/${videoId}/mqdefault.jpg`;
  }
}

export const pipedService = new YouTubeService();
export default pipedService;
