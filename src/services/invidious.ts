import axios, { type AxiosInstance } from 'axios';
import type {
  VideoInfo,
  SearchResult,
  TrendingVideo,
  PopularVideo,
  InvidiousInstance,
  DownloadOption,
} from '../types/video';

// CORS를 지원하는 공개 Invidious 인스턴스 목록
const INVIDIOUS_INSTANCES: InvidiousInstance[] = [
  { url: 'https://vid.puffyan.us', name: 'Puffyan', healthy: true },
  { url: 'https://invidious.fdn.fr', name: 'FDN', healthy: true },
  { url: 'https://inv.tux.pizza', name: 'Tux Pizza', healthy: true },
  { url: 'https://invidious.perennialte.ch', name: 'Perennial', healthy: true },
  { url: 'https://iv.ggtyler.dev', name: 'GGTyler', healthy: true },
];

// 개발 환경에서는 Vite 프록시 사용
const isDev = import.meta.env.DEV;
const PROXY_BASE = '/api/invidious';

class InvidiousService {
  private client: AxiosInstance;
  private currentInstance: InvidiousInstance;
  private instanceIndex: number = 0;
  private useProxy: boolean = isDev;

  constructor() {
    this.currentInstance = INVIDIOUS_INSTANCES[0];
    this.client = axios.create({
      baseURL: this.useProxy ? PROXY_BASE : this.currentInstance.url,
      timeout: 15000,
    });
  }

  // 인스턴스 헬스체크 및 전환
  async checkAndSwitchInstance(): Promise<boolean> {
    // 개발 환경에서는 프록시를 통해 체크
    if (this.useProxy) {
      try {
        const response = await axios.get(`${PROXY_BASE}/api/v1/stats`, { timeout: 5000 });
        if (response.status === 200) {
          return true;
        }
      } catch {
        // 프록시 실패시 다른 인스턴스 시도
        this.useProxy = false;
      }
    }

    for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
      const instance = INVIDIOUS_INSTANCES[(this.instanceIndex + i) % INVIDIOUS_INSTANCES.length];
      try {
        const response = await axios.get(`${instance.url}/api/v1/stats`, { timeout: 5000 });
        if (response.status === 200) {
          this.currentInstance = instance;
          this.instanceIndex = (this.instanceIndex + i) % INVIDIOUS_INSTANCES.length;
          this.client = axios.create({
            baseURL: instance.url,
            timeout: 15000,
          });
          return true;
        }
      } catch {
        instance.healthy = false;
      }
    }
    return false;
  }

  // 요청 래퍼 - 실패시 다른 인스턴스로 폴백
  private async request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    try {
      const response = await this.client.get<T>(path, { params });
      return response.data;
    } catch (error) {
      // 현재 인스턴스가 실패하면 다른 인스턴스로 전환
      const switched = await this.checkAndSwitchInstance();
      if (switched) {
        const response = await this.client.get<T>(path, { params });
        return response.data;
      }
      throw error;
    }
  }

  // 현재 인스턴스 URL 가져오기
  getCurrentInstanceUrl(): string {
    if (this.useProxy) {
      return `프록시 (${INVIDIOUS_INSTANCES[0].name})`;
    }
    return this.currentInstance.url;
  }

  // 실제 인스턴스 URL (다운로드/스트리밍용)
  getActualInstanceUrl(): string {
    return this.currentInstance.url;
  }

  // 영상 정보 가져오기
  async getVideo(videoId: string): Promise<VideoInfo> {
    return this.request<VideoInfo>(`/api/v1/videos/${videoId}`);
  }

  // 검색
  async search(query: string, page: number = 1, type: string = 'video'): Promise<SearchResult[]> {
    return this.request<SearchResult[]>('/api/v1/search', {
      q: query,
      page,
      type,
    });
  }

  // 트렌딩 영상
  async getTrending(region: string = 'KR', type?: string): Promise<TrendingVideo[]> {
    const params: Record<string, string> = { region };
    if (type) params.type = type;
    return this.request<TrendingVideo[]>('/api/v1/trending', params);
  }

  // 인기 영상
  async getPopular(): Promise<PopularVideo[]> {
    return this.request<PopularVideo[]>('/api/v1/popular');
  }

  // 다운로드 옵션 생성
  getDownloadOptions(video: VideoInfo): DownloadOption[] {
    const options: DownloadOption[] = [];
    const baseUrl = this.currentInstance.url;

    // 비디오+오디오 합성 스트림 (formatStreams)
    video.formatStreams.forEach((stream) => {
      options.push({
        url: stream.url.startsWith('http') ? stream.url : `${baseUrl}${stream.url}`,
        quality: stream.qualityLabel,
        type: 'combined',
        format: stream.container,
        size: stream.size,
        label: `${stream.qualityLabel} (${stream.container.toUpperCase()}) - 영상+음성`,
      });
    });

    // 비디오 전용 스트림
    video.adaptiveFormats
      .filter((f) => f.type?.startsWith('video/'))
      .forEach((format) => {
        if (format.qualityLabel) {
          options.push({
            url: format.url.startsWith('http') ? format.url : `${baseUrl}${format.url}`,
            quality: format.qualityLabel,
            type: 'video',
            format: format.container || 'mp4',
            label: `${format.qualityLabel} (영상만)`,
          });
        }
      });

    // 오디오 전용 스트림
    video.adaptiveFormats
      .filter((f) => f.type?.startsWith('audio/'))
      .forEach((format) => {
        const bitrate = format.bitrate ? `${Math.round(parseInt(format.bitrate) / 1000)}kbps` : '';
        options.push({
          url: format.url.startsWith('http') ? format.url : `${baseUrl}${format.url}`,
          quality: bitrate || format.audioQuality || 'audio',
          type: 'audio',
          format: format.container || 'webm',
          label: `오디오 ${bitrate} (${format.container || 'webm'})`,
        });
      });

    return options;
  }

  // 프록시 썸네일 URL 생성
  getProxyThumbnailUrl(videoId: string, quality: string = 'maxresdefault'): string {
    return `${this.currentInstance.url}/vi/${videoId}/${quality}.jpg`;
  }

  // 프록시 스트림 URL (영상 재생용)
  getProxyStreamUrl(videoId: string): string {
    return `${this.currentInstance.url}/latest_version?id=${videoId}&itag=22`;
  }
}

export const invidiousService = new InvidiousService();
export default invidiousService;
