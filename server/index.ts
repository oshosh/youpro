import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));
app.use(express.json());

// 프로덕션에서 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Invidious 인스턴스 목록 (작동하는 인스턴스들)
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks',
  'https://invidious.privacyredirect.de',
  'https://iv.nboeck.de',
  'https://invidious.protokolla.fi',
  'https://yt.artemislena.eu',
  'https://invidious.perennialte.ch',
];

let currentInstanceIndex = 0;

// 작동하는 Invidious 인스턴스 찾기
async function getWorkingInstance(): Promise<string | null> {
  for (let i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
    const idx = (currentInstanceIndex + i) % INVIDIOUS_INSTANCES.length;
    const instance = INVIDIOUS_INSTANCES[idx];
    
    try {
      const response = await fetch(`${instance}/api/v1/stats`, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        currentInstanceIndex = idx;
        console.log(`[Invidious] Using instance: ${instance}`);
        return instance;
      }
    } catch (e) {
      console.log(`[Invidious] Instance ${instance} failed`);
    }
  }
  
  return null;
}

// Invidious API 요청
async function invidiousRequest(endpoint: string): Promise<any> {
  const instance = await getWorkingInstance();
  if (!instance) {
    throw new Error('No working Invidious instance found');
  }
  
  const url = `${instance}${endpoint}`;
  console.log(`[Invidious] Request: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });
  
  if (!response.ok) {
    throw new Error(`Invidious returned ${response.status}`);
  }
  
  return response.json();
}

// 루트 경로 - Railway 헬스 체크용
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'YouPro API Server (Invidious Proxy)' });
});

// 헬스 체크
app.get('/api/health', async (req, res) => {
  try {
    const instance = await getWorkingInstance();
    if (instance) {
      res.json({ status: 'ok', instance });
    } else {
      res.status(503).json({ status: 'error', message: 'No working Invidious instance' });
    }
  } catch (error: any) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});

// 검색
app.get('/api/search', async (req, res) => {
  const { q, page = 1 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  
  try {
    const data = await invidiousRequest(`/api/v1/search?q=${encodeURIComponent(q as string)}&page=${page}`);
    
    // Invidious 형식을 우리 형식으로 변환
    const results = data
      .filter((item: any) => item.type === 'video')
      .map((video: any) => ({
        type: 'video',
        title: video.title || '',
        videoId: video.videoId,
        author: video.author || '',
        authorId: video.authorId || '',
        authorUrl: `/channel/${video.authorId || ''}`,
        authorVerified: video.authorVerified || false,
        videoThumbnails: video.videoThumbnails || [{ url: `/vi/${video.videoId}/mqdefault.jpg`, width: 320, height: 180 }],
        description: video.description || '',
        viewCount: video.viewCount || 0,
        viewCountText: video.viewCountText || '',
        publishedText: video.publishedText || '',
        lengthSeconds: video.lengthSeconds || 0,
        liveNow: video.liveNow || false,
      }));
    
    res.json({ results, nextpage: String(parseInt(page as string) + 1) });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// 트렌딩
app.get('/api/trending', async (req, res) => {
  const { region = 'KR' } = req.query;
  
  try {
    const data = await invidiousRequest(`/api/v1/trending?region=${region}`);
    
    const results = data.map((video: any) => ({
      type: 'video',
      title: video.title || '',
      videoId: video.videoId,
      author: video.author || '',
      authorId: video.authorId || '',
      authorUrl: `/channel/${video.authorId || ''}`,
      authorVerified: video.authorVerified || false,
      videoThumbnails: video.videoThumbnails || [{ url: `/vi/${video.videoId}/mqdefault.jpg`, width: 320, height: 180 }],
      description: video.description || '',
      viewCount: video.viewCount || 0,
      viewCountText: video.viewCountText || '',
      publishedText: video.publishedText || '',
      lengthSeconds: video.lengthSeconds || 0,
      liveNow: video.liveNow || false,
    }));
    
    res.json(results);
  } catch (error: any) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Trending fetch failed', details: error.message });
  }
});

// 영상 정보
app.get('/api/video/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  try {
    const data = await invidiousRequest(`/api/v1/videos/${videoId}`);
    
    // 스트림 URL에서 Invidious 호스트를 우리 프록시로 변경
    const videoStreams = (data.formatStreams || []).map((stream: any) => ({
      url: stream.url || '',
      format: stream.container || 'mp4',
      quality: stream.qualityLabel || stream.quality || '',
      mimeType: stream.type || '',
      height: stream.height || 0,
      width: stream.width || 0,
      bitrate: stream.bitrate || 0,
      videoOnly: false,
      itag: stream.itag,
    }));
    
    // Adaptive formats (video only, audio only)
    const adaptiveVideoStreams = (data.adaptiveFormats || [])
      .filter((f: any) => f.type?.includes('video'))
      .map((stream: any) => ({
        url: stream.url || '',
        format: stream.container || 'mp4',
        quality: stream.qualityLabel || stream.quality || '',
        mimeType: stream.type || '',
        height: stream.height || 0,
        width: stream.width || 0,
        bitrate: stream.bitrate || 0,
        videoOnly: !stream.type?.includes('audio'),
        itag: stream.itag,
      }));
    
    const audioStreams = (data.adaptiveFormats || [])
      .filter((f: any) => f.type?.includes('audio'))
      .map((stream: any) => ({
        url: stream.url || '',
        format: stream.container || 'webm',
        quality: stream.audioQuality || 'medium',
        mimeType: stream.type || '',
        bitrate: stream.bitrate || 0,
        videoOnly: false,
        itag: stream.itag,
      }));
    
    const videoInfo = {
      title: data.title || '',
      videoId: videoId,
      description: data.description || '',
      author: data.author || '',
      authorId: data.authorId || '',
      authorUrl: `/channel/${data.authorId || ''}`,
      authorVerified: data.authorVerified || false,
      authorThumbnail: data.authorThumbnails?.[0]?.url || '',
      subscriberCount: data.subCountText || 0,
      viewCount: data.viewCount || 0,
      likeCount: data.likeCount || 0,
      dislikeCount: data.dislikeCount || 0,
      lengthSeconds: data.lengthSeconds || 0,
      publishedText: data.publishedText || '',
      videoThumbnails: data.videoThumbnails || [{ url: `/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 }],
      liveNow: data.liveNow || false,
      hlsUrl: data.hlsUrl || null,
      dashUrl: data.dashUrl || null,
      audioStreams,
      videoStreams: [...videoStreams, ...adaptiveVideoStreams],
      recommendedVideos: (data.recommendedVideos || []).slice(0, 10).map((v: any) => ({
        type: 'video',
        title: v.title || '',
        videoId: v.videoId,
        author: v.author || '',
        authorId: v.authorId || '',
        authorUrl: `/channel/${v.authorId || ''}`,
        authorVerified: false,
        videoThumbnails: v.videoThumbnails || [{ url: `/vi/${v.videoId}/mqdefault.jpg`, width: 320, height: 180 }],
        description: '',
        viewCount: v.viewCount || 0,
        viewCountText: v.viewCountText || '',
        publishedText: v.publishedText || '',
        lengthSeconds: v.lengthSeconds || 0,
        liveNow: false,
      })),
    };
    
    res.json(videoInfo);
  } catch (error: any) {
    console.error('Video info error:', error);
    res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
  }
});

// 비디오 스트림 프록시 (Invidious 스트림 URL 프록시)
app.get('/api/proxy/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const { quality, itag } = req.query;
  
  try {
    // Invidious에서 비디오 정보 가져오기
    const data = await invidiousRequest(`/api/v1/videos/${videoId}`);
    
    // 요청된 품질에 맞는 스트림 찾기
    let targetHeight = 720;
    if (quality && typeof quality === 'string') {
      const match = quality.match(/(\d+)/);
      if (match) {
        targetHeight = parseInt(match[1]);
      }
    }
    
    // formatStreams에서 영상+오디오 결합된 스트림 찾기
    const formatStreams = data.formatStreams || [];
    let stream = formatStreams.find((s: any) => s.height === targetHeight);
    
    if (!stream) {
      // 가장 높은 품질 선택
      stream = formatStreams.sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
    }
    
    // itag로 직접 찾기
    if (itag) {
      const allFormats = [...formatStreams, ...(data.adaptiveFormats || [])];
      const found = allFormats.find((s: any) => s.itag == itag);
      if (found) stream = found;
    }
    
    if (!stream || !stream.url) {
      return res.status(404).json({ error: 'No suitable stream found' });
    }
    
    console.log(`[Proxy] Streaming ${videoId} at ${stream.qualityLabel || stream.quality}`);
    
    // Range 헤더 처리
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }
    
    // YouTube/Invidious 스트림 가져오기
    const response = await fetch(stream.url, { headers });
    
    if (!response.ok) {
      throw new Error(`Stream returned ${response.status}`);
    }
    
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
        try {
          const { done, value } = await reader.read();
          if (done || res.closed) {
            res.end();
            return;
          }
          res.write(Buffer.from(value));
          return pump();
        } catch (err) {
          console.error('Stream error:', err);
          res.end();
        }
      };
      
      req.on('close', () => {
        reader.cancel();
      });
      
      await pump();
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream proxy failed', details: error.message });
    }
  }
});

// 썸네일 프록시
app.get('/vi/:videoId/:quality.jpg', async (req, res) => {
  const { videoId, quality } = req.params;
  
  const thumbnailUrls = [
    `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`,
    `https://img.youtube.com/vi/${videoId}/${quality}.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];
  
  for (const url of thumbnailUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(Buffer.from(buffer));
        return;
      }
    } catch (e) {
      // 다음 URL 시도
    }
  }
  
  res.status(404).send('Thumbnail not found');
});

// SPA fallback (프로덕션용)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/vi')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`🚀 YouPro API Server running on port ${PORT}`);
  console.log(`📺 Using Invidious API for YouTube data`);
  
  // 시작 시 작동하는 인스턴스 확인
  getWorkingInstance().then(instance => {
    if (instance) {
      console.log(`✅ Working Invidious instance: ${instance}`);
    } else {
      console.log('⚠️ No working Invidious instance found');
    }
  });
});
