const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, hsl(var(--muted) / 0.3) 25%, hsl(var(--muted) / 0.15) 50%, hsl(var(--muted) / 0.3) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  borderRadius: 12,
};

const barStyle = (w: string, h = 12): React.CSSProperties => ({
  ...shimmerStyle,
  width: w,
  height: h,
  borderRadius: 6,
});

export const SkeletonCard = ({ hasPhoto = false, photoHeight = 140 }: { hasPhoto?: boolean; photoHeight?: number }) => (
  <div style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", overflow: "hidden", background: "hsl(var(--card))" }}>
    {hasPhoto && <div style={{ ...shimmerStyle, height: photoHeight, borderRadius: 0 }} />}
    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={barStyle("60%", 14)} />
      <div style={barStyle("90%")} />
      <div style={barStyle("40%")} />
    </div>
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
);

export const SkeletonFeedCard = () => (
  <div style={{ borderRadius: 12, border: "1px solid hsl(var(--border))", overflow: "hidden", background: "hsl(var(--card))", padding: 14 }}>
    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
      <div style={{ ...shimmerStyle, width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={barStyle("40%", 12)} />
        <div style={barStyle("25%", 10)} />
      </div>
    </div>
    <div style={barStyle("100%", 14)} />
    <div style={{ ...barStyle("80%"), marginTop: 6 }} />
    <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
      <div style={barStyle("60px", 28)} />
      <div style={barStyle("60px", 28)} />
    </div>
    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
  </div>
);

export const SkeletonList = ({ count = 3, hasPhoto = false, photoHeight = 140 }: { count?: number; hasPhoto?: boolean; photoHeight?: number }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} hasPhoto={hasPhoto} photoHeight={photoHeight} />
    ))}
  </div>
);

export const SkeletonGrid = ({ count = 3, hasPhoto = false, photoHeight = 140, cols = 2 }: { count?: number; hasPhoto?: boolean; photoHeight?: number; cols?: number }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} hasPhoto={hasPhoto} photoHeight={photoHeight} />
    ))}
  </div>
);

export const SkeletonFeedList = ({ count = 3 }: { count?: number }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonFeedCard key={i} />
    ))}
  </div>
);
