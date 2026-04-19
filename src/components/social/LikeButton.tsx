import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLikes, EntityType } from "@/hooks/useLikes";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";

interface LikeButtonProps {
  entityType: EntityType;
  entityId: string;
  size?: "sm" | "default";
}

export function LikeButton({ entityType, entityId, size = "sm" }: LikeButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // For logged-out users, render a lightweight stub that does NOT fire
  // any Supabase queries — clicking simply routes to /auth.
  if (!user) {
    return (
      <Button variant="ghost" size={size} className="gap-1" onClick={() => navigate("/auth")}>
        <Heart className="w-4 h-4" />
      </Button>
    );
  }

  return <LikeButtonAuthed entityType={entityType} entityId={entityId} size={size} />;
}

function LikeButtonAuthed({ entityType, entityId, size }: LikeButtonProps) {
  const { isLiked, count, toggle } = useLikes(entityType, entityId);

  return (
    <Button variant="ghost" size={size} className="gap-1" onClick={() => toggle()}>
      <Heart className={`w-4 h-4 transition-colors ${isLiked ? "fill-destructive text-destructive" : ""}`} />
      {count > 0 && <span className="text-xs">{count}</span>}
    </Button>
  );
}
