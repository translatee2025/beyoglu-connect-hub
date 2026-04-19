import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#DCFCE7', text: '#166534' },
  { bg: '#FECACA', text: '#991B1B' },
];

const getAvatarColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

type ProfileMini = { display_name: string | null; avatar_url: string | null };

// ─── Shared batch loader ──────────────────────────────────────
// All <UserName /> instances rendered within the same ~30ms tick
// get coalesced into ONE supabase `.in()` query, then their per-id
// React Query caches are populated. This eliminates the N+1 problem
// without requiring any changes to consuming pages.

let pendingIds = new Set<string>();
let pendingResolvers: Array<{ ids: string[]; resolve: (map: Record<string, ProfileMini>) => void; reject: (e: any) => void }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushBatch = async () => {
  flushTimer = null;
  const ids = Array.from(pendingIds);
  const resolvers = pendingResolvers;
  pendingIds = new Set();
  pendingResolvers = [];
  if (ids.length === 0) return;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", ids);
    if (error) throw error;
    const map: Record<string, ProfileMini> = {};
    (data || []).forEach((p: any) => {
      map[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
    });
    resolvers.forEach(r => r.resolve(map));
  } catch (e) {
    resolvers.forEach(r => r.reject(e));
  }
};

const fetchProfileBatched = (userId: string): Promise<ProfileMini | null> => {
  return new Promise((resolve, reject) => {
    pendingIds.add(userId);
    pendingResolvers.push({
      ids: [userId],
      resolve: (map) => resolve(map[userId] ?? null),
      reject,
    });
    if (!flushTimer) {
      flushTimer = setTimeout(flushBatch, 30);
    }
  });
};

interface UserNameProps {
  userId: string;
  showAvatar?: boolean;
  avatarSize?: string;
  className?: string;
}

export function UserName({ userId, showAvatar = false, avatarSize = "w-6 h-6", className = "" }: UserNameProps) {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-mini", userId],
    queryFn: async () => {
      const result = await fetchProfileBatched(userId);
      // Also seed sibling caches if the batch returned other profiles we just fetched.
      // (Not strictly necessary since each useQuery hook fires its own batched call,
      // but keeps things consistent if profileMap data arrives via prefetch.)
      return result;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    enabled: !!userId,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
