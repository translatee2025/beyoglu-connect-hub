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
  const { isLiked, count, toggle } = useLikes(entityType, entityId);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toggle();
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className="gap-1"
      onClick={handleClick}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${isLiked ? "fill-destructive text-destructive" : ""}`}
      />
      {count > 0 && <span className="text-xs">{count}</span>}
    </Button>
  );
}
