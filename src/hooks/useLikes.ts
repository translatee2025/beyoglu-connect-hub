import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export type EntityType = "wall_post" | "classified" | "venue" | "pet_post" | "help_post";

export function useLikes(entityType: EntityType, entityId: string) {
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
      return data || [];
    },
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
