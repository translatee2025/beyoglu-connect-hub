import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { createNotification, getDisplayName, getContentOwnerId, getEntityLink } from "@/lib/notifications";

export type EntityType = "wall_post" | "classified" | "venue" | "pet_post" | "help_post" | "reel";

export interface LikeRow {
  id: string;
  user_id: string;
}

// Likes don't need second-by-second freshness; caching for a minute removes the
// refetch storm that previously fired on every render/navigation.
const LIKES_STALE = 1000 * 60;

export function useLikes(entityType: EntityType, entityId: string, initialData?: LikeRow[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["likes", entityType, entityId];

  const { data: likes = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from("likes")
        .select("id, user_id")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
      return (data || []) as LikeRow[];
    },
    staleTime: LIKES_STALE,
    // When a feed has prefetched likes in one batch query (useEntityLikesMap),
    // seeding initialData here means this per-card query is already "fresh" and
    // does NOT fire its own request — eliminating the N+1.
    ...(initialData ? { initialData } : {}),
  });

  const isLiked = user ? likes.some((l) => l.user_id === user.id) : false;
  const count = likes.length;

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("entity_type", entityType)
          .eq("entity_id", entityId);
      } else {
        await supabase.from("likes").insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
        });

        // Send notification to content owner (not for unlike, not for own content)
        try {
          const ownerId = await getContentOwnerId(entityType, entityId);
          if (ownerId && ownerId !== user.id) {
            const displayName = await getDisplayName(user.id);
            await createNotification({
              userId: ownerId,
              type: "like",
              body: `${displayName} liked your post`,
              link: getEntityLink(entityType),
            });
          }
        } catch {}
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any[] = []) => {
        if (isLiked) return old.filter((l) => l.user_id !== user!.id);
        return [...old, { id: "temp", user_id: user!.id }];
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { isLiked, count, toggle: toggleLike.mutate };
}

/**
 * Batch-load likes for many entities in ONE query, instead of one query per
 * card. Returns a map of entityId -> like rows. Pass `map[id]` as the
 * `initialData`/`initialLikes` for each LikeButton so the per-card queries are
 * pre-seeded and never fire (kills the feed N+1). Only runs for logged-in users
 * (logged-out cards render a static stub with no like state).
 */
export function useEntityLikesMap(entityIds: string[]): Record<string, LikeRow[]> {
  const { user } = useAuth();
  const ids = Array.from(new Set(entityIds.filter(Boolean)));
  const cacheKey = ids.slice().sort().join(",");

  const { data } = useQuery({
    queryKey: ["likes-batch", cacheKey],
    enabled: !!user && ids.length > 0,
    staleTime: LIKES_STALE,
    queryFn: async () => {
      const { data } = await supabase
        .from("likes")
        .select("id, user_id, entity_id")
        .in("entity_id", ids);
      const map: Record<string, LikeRow[]> = {};
      for (const id of ids) map[id] = [];
      for (const row of data || []) {
        (map[row.entity_id] ||= []).push({ id: row.id, user_id: row.user_id });
      }
      return map;
    },
  });

  return data || {};
}
