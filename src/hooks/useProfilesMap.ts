import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface ProfileMini {
  display_name: string | null;
  avatar_url: string | null;
}

export type ProfilesMap = Record<string, ProfileMini>;

/**
 * Page-level profile loader. Pass an array of user_ids (typically from a list
 * of cards) and get back a single { [userId]: { display_name, avatar_url } }
 * map fetched with ONE `.in()` query — no per-card N+1 storm.
 *
 * Memoizes the de-duplicated id list so repeated re-renders don't re-fetch.
 */
export function useProfilesMap(userIds: Array<string | null | undefined>) {
  const ids = useMemo(() => {
    const set = new Set<string>();
    for (const id of userIds) {
      if (id) set.add(id);
    }
    return Array.from(set).sort();
  }, [userIds]);

  const queryKey = useMemo(() => ["profiles-map", ids.join(",")], [ids]);

  const { data = {}, isLoading } = useQuery<ProfilesMap>({
    queryKey,
    queryFn: async () => {
      if (ids.length === 0) return {};
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      if (error) throw error;
      const map: ProfilesMap = {};
      (data || []).forEach((p: any) => {
        map[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });
      return map;
    },
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  return { profilesMap: data, isLoading };
}
