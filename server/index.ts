import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import Innertube from 'youtubei.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 프로덕션에서 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// InnerTube 클라이언트
let client: any = null;
let initPromise: Promise<boolean> | null = null;
let initError: string | null = null;

// InnerTube 초기화 (비동기, 논블로킹)
async function initInnerTube(): Promise<boolean> {
  if (client) return true;
  
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log('📺 Initializing InnerTube...');
      client = await Innertube.create({
        location: 'US',
        lang: 'en',
      });
      console.log('✅ InnerTube client initialized');
      initError = null;
      return true;
    } catch (error: any) {
      console.error('❌ Failed to initialize InnerTube:', error.message);
      initError = error.message;
      initPromise = null;
      return false;
    }
  })();
  
  return initPromise;
}

// 루트 경로 - Railway 헬스 체크용
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // SPA 서빙
    return res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
  res.json({ 
    status: 'ok', 
    message: 'YouPro API Server',
    innertube: client ? 'ready' : 'initializing',
    error: initError
  });
});

// 헬스 체크 - 항상 응답
app.get('/api/health', (req, res) => {
  res.json({ 
    status: client ? 'ok' : 'initializing', 
    message: client ? 'InnerTube ready' : 'InnerTube initializing...',
    error: initError
  });
});

// 검색
app.get('/api/search', async (req, res) => {
  const { q, page = 1 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  
  if (!client) {
    const success = await initInnerTube();
    if (!success) {
      return res.status(503).json({ error: 'Service initializing, please try again', details: initError });
    }
  }
  
  try {
    const searchResults = await client.search(q as string);
    
    const results = (searchResults.videos || []).map((video: any) => ({
      type: 'video',
      title: video.title?.text || video.title || '',
      videoId: video.id,
      author: video.author?.name || video.channel?.name || '',
      authorId: video.author?.id || video.channel?.id || '',
      authorUrl: `/channel/${video.author?.id || video.channel?.id || ''}`,
      authorVerified: video.author?.is_verified || false,
      videoThumbnails: [{ 
        url: video.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
        width: 320, 
        height: 180 
      }],
      description: video.description?.text || video.snippets?.[0]?.text?.text || '',
      viewCount: video.view_count?.text ? parseInt(video.view_count.text.replace(/[^0-9]/g, '')) : 0,
      viewCountText: video.short_view_count?.text || video.view_count?.text || '',
      publishedText: video.published?.text || '',
      lengthSeconds: video.duration?.seconds || 0,
      liveNow: video.is_live || false,
    }));

    res.json({ results, nextpage: searchResults.has_continuation ? String(parseInt(page as string) + 1) : '' });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// 트렌딩
app.get('/api/trending', async (req, res) => {
  if (!client) {
    const success = await initInnerTube();
    if (!success) {
      return res.status(503).json({ error: 'Service initializing, please try again', details: initError });
    }
  }
  
  try {
    const trending = await client.getTrending();
    
    const results = (trending.videos || trending.contents || []).slice(0, 30).map((video: any) => {
      const v = video.content || video;
      return {
        type: 'video',
        title: v.title?.text || v.title || '',
        videoId: v.id || v.video_id,
        author: v.author?.name || v.channel?.name || '',
        authorId: v.author?.id || v.channel?.id || '',
        authorUrl: `/channel/${v.author?.id || v.channel?.id || ''}`,
        authorVerified: v.author?.is_verified || false,
        videoThumbnails: [{ 
          url: v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id || v.video_id}/mqdefault.jpg`,
          width: 320, 
          height: 180 
        }],
        description: '',
        viewCount: 0,
        viewCountText: v.short_view_count?.text || v.view_count?.text || '',
        publishedText: v.published?.text || '',
        lengthSeconds: v.duration?.seconds || 0,
        liveNow: v.is_live || false,
      };
    });

    res.json(results);
  } catch (error: any) {
    console.error('Trending error:', error);
    
    // fallback: 검색으로 인기 영상 가져오기
    try {
      const searchResults = await client.search('music 2025');
      const results = (searchResults.videos || []).slice(0, 20).map((video: any) => ({
        type: 'video',
        title: video.title?.text || video.title || '',
        videoId: video.id,
        author: video.author?.name || '',
        authorId: video.author?.id || '',
        authorUrl: `/channel/${video.author?.id || ''}`,
        authorVerified: false,
        videoThumbnails: [{ 
          url: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
          width: 320, 
          height: 180 
        }],
        description: '',
        viewCount: 0,
        viewCountText: video.short_view_count?.text || '',
        publishedText: video.published?.text || '',
        lengthSeconds: video.duration?.seconds || 0,
        liveNow: false,
      }));
      res.json(results);
    } catch (fallbackError: any) {
      res.status(500).json({ error: 'Trending fetch failed', details: error.message });
    }
  }
});

// 영상 정보
app.get('/api/video/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  if (!client) {
    const success = await initInnerTube();
    if (!success) {
      return res.status(503).json({ error: 'Service initializing', details: initError });
    }
  }
  
  try {
    const info = await client.getInfo(videoId);
    
    const formats = info.streaming_data?.formats || [];
    const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
    
    const videoStreams = [...formats, ...adaptiveFormats]
      .filter((f: any) => f.has_video)
      .map((f: any) => ({
        url: f.url || '',
        format: f.container || 'mp4',
        quality: f.quality_label || f.quality || '',
        mimeType: f.mime_type || '',
        height: f.height || 0,
        width: f.width || 0,
        bitrate: f.bitrate || 0,
        videoOnly: !f.has_audio,
        itag: f.itag,
      }));

    const audioStreams = adaptiveFormats
      .filter((f: any) => f.has_audio && !f.has_video)
      .map((f: any) => ({
        url: f.url || '',
        format: f.container || 'webm',
        quality: f.audio_quality || 'medium',
        mimeType: f.mime_type || '',
        bitrate: f.bitrate || 0,
        videoOnly: false,
        itag: f.itag,
      }));

    const videoInfo = {
      title: info.basic_info?.title || '',
      videoId: videoId,
      description: info.basic_info?.short_description || '',
      author: info.basic_info?.author || '',
      authorId: info.basic_info?.channel_id || '',
      authorUrl: `/channel/${info.basic_info?.channel_id || ''}`,
      authorVerified: false,
      authorThumbnail: '',
      subscriberCount: 0,
      viewCount: info.basic_info?.view_count || 0,
      likeCount: info.basic_info?.like_count || 0,
      dislikeCount: 0,
      lengthSeconds: info.basic_info?.duration || 0,
      publishedText: info.primary_info?.published?.text || '',
      videoThumbnails: [{ 
        url: info.basic_info?.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        width: 1280, 
        height: 720 
      }],
      liveNow: info.basic_info?.is_live || false,
      hlsUrl: info.streaming_data?.hls_manifest_url || null,
      dashUrl: info.streaming_data?.dash_manifest_url || null,
      audioStreams,
      videoStreams,
      recommendedVideos: (info.watch_next_feed || []).slice(0, 10).map((v: any) => ({
        type: 'video',
        title: v.title?.text || '',
        videoId: v.id,
        author: v.author?.name || '',
        authorId: v.author?.id || '',
        authorUrl: '',
        authorVerified: false,
        videoThumbnails: [{ 
          url: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
          width: 320, 
          height: 180 
        }],
        description: '',
        viewCount: 0,
        viewCountText: v.short_view_count?.text || '',
        publishedText: '',
        lengthSeconds: v.duration?.seconds || 0,
        liveNow: false,
      })),
    };

    res.json(videoInfo);
  } catch (error: any) {
    console.error('Video info error:', error);
    res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
  }
});

// 스트림 URL
app.get('/api/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const { itag } = req.query;
  
  if (!client) {
    const success = await initInnerTube();
    if (!success) {
      return res.status(503).json({ error: 'Service initializing', details: initError });
    }
  }
  
  try {
    const info = await client.getInfo(videoId);
    const formats = [...(info.streaming_data?.formats || []), ...(info.streaming_data?.adaptive_formats || [])];
    
    let format = itag 
      ? formats.find((f: any) => f.itag == itag)
      : formats.find((f: any) => f.has_video && f.has_audio);
    
    if (!format) format = formats[0];
    
    if (!format?.url && format?.decipher) {
      format.url = await format.decipher(client.session.player);
    }
    
    if (!format?.url) {
      return res.status(404).json({ error: 'No stream URL found' });
    }

    res.json({ url: format.url, itag: format.itag, quality: format.quality_label || format.quality });
  } catch (error: any) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to get stream', details: error.message });
  }
});

// 비디오 스트림 프록시 (CORS 우회)
app.get('/api/proxy/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const { itag } = req.query;
  
  if (!client) {
    const success = await initInnerTube();
    if (!success) {
      return res.status(503).json({ error: 'Service initializing' });
    }
  }
  
  try {
    const info = await client.getInfo(videoId);
    const formats = [...(info.streaming_data?.formats || []), ...(info.streaming_data?.adaptive_formats || [])];
    
    // itag로 포맷 찾기 또는 영상+오디오 결합 포맷 선택
    let format = itag 
      ? formats.find((f: any) => f.itag == itag)
      : formats.find((f: any) => f.has_video && f.has_audio);
    
    if (!format) format = formats[0];
    
    if (!format?.url && format?.decipher) {
      format.url = await format.decipher(client.session.player);
    }
    
    if (!format?.url) {
      return res.status(404).json({ error: 'No stream URL found' });
    }

    // Range 헤더 처리 (시크 지원)
    const range = req.headers.range;
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    
    if (range) {
      headers['Range'] = range;
    }

    // YouTube에서 스트림 가져오기
    const response = await fetch(format.url, { headers });
    
    // 응답 헤더 설정
    res.status(response.status);
    
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges');
    
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // 스트림 파이프
    if (response.body) {
      const reader = response.body.getReader();
      
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(Buffer.from(value));
        return pump();
      };
      
      await pump();
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Stream proxy failed', details: error.message });
  }
});

// 썸네일 프록시
app.get('/vi/:videoId/:quality.jpg', async (req, res) => {
  const { videoId, quality } = req.params;
  const url = `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
  
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(404).send('Thumbnail not found');
  }
});

// SPA fallback (프로덕션용)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // API 요청은 그대로 통과
    if (req.path.startsWith('/api') || req.path.startsWith('/vi')) {
      return next();
    }
    // 그 외 모든 요청은 index.html 반환
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// 서버 시작 - 바로 리스닝 시작 (InnerTube 초기화 기다리지 않음)
const server = app.listen(PORT, () => {
  console.log(`🚀 YouPro API Server running on port ${PORT}`);
  console.log(`📺 InnerTube will initialize on first request`);
});

// 백그라운드에서 InnerTube 초기화 시작
initInnerTube();
