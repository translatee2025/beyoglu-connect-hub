import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AVATAR_COLORS = [
  { bg: '#BBF7D0', text: '#166534' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#E0F2FE', text: '#0369A1' },
  { bg: '#FECACA', text: '#991B1B' },
];

const getAvatarColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface UserNameProps {
  userId: string;
  showAvatar?: boolean;
  avatarSize?: string;
  className?: string;
}

export function UserName({ userId, showAvatar = false, avatarSize = "w-6 h-6", className = "" }: UserNameProps) {
  const { data: profile } = useQuery({
    queryKey: ["profile-mini", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
  });

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
          <AvatarFallback className="text-[10px] font-medium" style={{ backgroundColor: colors.bg, color: colors.text }}>{initials}</AvatarFallback>
        </Avatar>
      )}
      <span>{name}</span>
    </Link>
  );
}
