import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProfilesMap } from "@/hooks/useProfilesMap";

const AVATAR_COLORS = [
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#DCFCE7", text: "#166534" },
  { bg: "#FECACA", text: "#991B1B" },
];

const getAvatarColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++)
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface ProfileInlineProps {
  userId: string;
  profilesMap: ProfilesMap;
  showAvatar?: boolean;
  avatarSize?: string;
  className?: string;
}

/**
 * Presentational profile renderer for use inside repeated card lists.
 * Reads from a pre-fetched profilesMap (via useProfilesMap) — does NOT fetch.
 */
export function ProfileInline({
  userId,
  profilesMap,
  showAvatar = false,
  avatarSize = "w-6 h-6",
  className = "",
}: ProfileInlineProps) {
  const profile = profilesMap[userId];
  const name = profile?.display_name || "User";
  const initials = name.slice(0, 2).toUpperCase();
  const colors = getAvatarColor(userId);

  return (
    <Link
      to={`/profile/${userId}`}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary hover:underline ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {showAvatar && (
        <Avatar className={avatarSize}>
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback
            className="text-[10px] font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      <span>{name}</span>
    </Link>
  );
}
