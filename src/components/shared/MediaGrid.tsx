import { Film } from "lucide-react";
import { SafeImage } from "@/components/shared/SafeImage";

interface MediaGridProps {
  urls: string[];
  className?: string;
}

const isVideo = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url);

export function MediaGrid({ urls, className = "" }: MediaGridProps) {
  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    const url = urls[0];
    return (
      <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
        {isVideo(url) ? (
          <video src={url} controls className="w-full max-h-80 object-cover" />
        ) : (
          <SafeImage
            src={url}
            className="w-full max-h-80 object-cover"
            fallbackBg="#EFF4FF"
            fallbackEmoji="🖼️"
            style={{ height: 240 }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-1.5 rounded-lg overflow-hidden ${
        urls.length === 2 ? "grid-cols-2" : "grid-cols-3"
      } ${className}`}
    >
      {urls.slice(0, 6).map((url, i) => (
        <div
          key={i}
          className="relative aspect-square overflow-hidden border border-border rounded bg-muted"
        >
          {isVideo(url) ? (
            <>
              <video src={url} className="w-full h-full object-cover" muted />
              <div className="absolute bottom-1 left-1">
                <Film className="w-4 h-4 text-primary-foreground drop-shadow" />
              </div>
            </>
          ) : (
            <SafeImage
              src={url}
              className="w-full h-full object-cover"
              fallbackBg="#EFF4FF"
              fallbackEmoji="🖼️"
            />
          )}
        </div>
      ))}
    </div>
  );
}
