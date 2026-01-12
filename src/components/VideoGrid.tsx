import VideoCard from './VideoCard';
import type { VideoSearchResult, TrendingVideo } from '../types/video';

interface VideoGridProps {
  videos: (VideoSearchResult | TrendingVideo)[];
  title?: string;
}

export default function VideoGrid({ videos, title }: VideoGridProps) {
  return (
    <section>
      {title && (
        <h2 className="text-xl font-display font-semibold mb-4">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard key={video.videoId} video={video} />
        ))}
      </div>
    </section>
  );
}

