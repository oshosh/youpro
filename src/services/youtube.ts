import axios from 'axios';
import type {
  VideoInfo,
  VideoSearchResult,
  TrendingVideo,
  DownloadOption,
} from '../types/video';

// 로컬 백엔드 API URL
const API_BASE = 'http://localhost:3001/api';

class YouTubeService {
  private client = axios.create({
    baseURL: API_BASE,
    timeout: 60000, // yt-dlp는 시간이 걸릴 수 있음
  });

  // 헬스 체크
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  // 영상 정보 가져오기
  async getVideo(videoId: string): Promise<VideoInfo> {
    const response = await this.client.get(`/video/${videoId}`);
    return response.data;
  }

  // 검색
  async search(query: string): Promise<{ results: VideoSearchResult[]; nextpage: string }> {
    const response = await this.client.get('/search', {
      params: { q: query, limit: 20 },
    });
    return response.data;
  }

  // 트렌딩 영상
  async getTrending(region: string = 'KR'): Promise<TrendingVideo[]> {
    const response = await this.client.get('/trending', {
      params: { region },
    });
    return response.data;
  }

  // 다운로드 옵션 생성
  getDownloadOptions(video: VideoInfo): DownloadOption[] {
    const options: DownloadOption[] = [];

    // 비디오 스트림
    video.videoStreams
      .filter((s) => s.url)
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .forEach((stream) => {
        const isVideoOnly = stream.videoOnly;
        const quality = stream.quality || `${stream.height}p`;
        const format = stream.format || 'mp4';
        
        options.push({
          url: stream.url,
          quality,
          type: isVideoOnly ? 'video' : 'combined',
          format,
          label: isVideoOnly 
            ? `${quality} (영상만, ${format})`
            : `${quality} (${format}) - 영상+음성`,
        });
      });

    // 오디오 스트림
    video.audioStreams
      .filter((s) => s.url)
      .sort((a, b) => b.bitrate - a.bitrate)
      .slice(0, 5)
      .forEach((stream) => {
        const bitrate = stream.quality || `${Math.round(stream.bitrate / 1000)}kbps`;
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
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  }
}

export const youtubeService = new YouTubeService();
export default youtubeService;

