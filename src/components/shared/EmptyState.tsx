import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  emoji: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ emoji, message, actionLabel, onAction }: EmptyStateProps) => (
  <div style={{ textAlign: "center", padding: "48px 16px" }}>
    <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>{emoji}</span>
    <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", marginBottom: actionLabel ? 20 : 0, maxWidth: 320, margin: "0 auto", lineHeight: 1.6 }}>
      {message}
    </p>
    {actionLabel && onAction && (
      <Button onClick={onAction} style={{ marginTop: 20, background: "#E74C3C", color: "#fff", border: "none" }}>
        {actionLabel}
      </Button>
    )}
  </div>
);
