import { useState, useEffect, type CSSProperties } from "react";

interface SafeImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** Emoji or short text shown in the placeholder when src is missing or fails. */
  fallbackEmoji?: string;
  /** Background color for the placeholder. */
  fallbackBg?: string;
  /** Additional className for the placeholder container. */
  placeholderClassName?: string;
}

/**
 * Drop-in replacement for `<img>` that:
 * - shows a stable, themed placeholder when src is missing OR fails to load
 * - uses local state instead of mutating DOM via onError
 * - lazy-loads by default
 *
 * Use this everywhere a card photo could be missing or broken.
 */
export function SafeImage({
  src,
  alt = "",
  className = "",
  style,
  fallbackEmoji = "📷",
  fallbackBg = "#EFF4FF",
  placeholderClassName = "",
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  // Reset the error state whenever the source changes, so a transient failure
  // (slow network, one-off 4xx) never hides a now-valid image permanently
  // across react-query refetches, list reorders, or filter changes.
  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center ${className} ${placeholderClassName}`}
        style={{ backgroundColor: fallbackBg, ...style }}
        aria-label={alt || "Image placeholder"}
      >
        <span style={{ fontSize: 28, opacity: 0.7 }}>{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      style={style}
      onError={() => setErrored(true)}
    />
  );
}
