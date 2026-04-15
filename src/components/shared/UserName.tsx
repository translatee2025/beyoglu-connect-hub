import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  return (
    <Link
      to={`/profile/${userId}`}
      className={`inline-flex items-center gap-1.5 hover:underline text-foreground font-medium ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {showAvatar && (
        <Avatar className={avatarSize}>
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      )}
      <span className="text-sm">{name}</span>
    </Link>
  );
}
