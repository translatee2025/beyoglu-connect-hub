import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/providers/LanguageProvider";
import { useMemo } from "react";

export interface AppOption {
  value: string;
  label: string;
  emoji: string | null;
  metadata: Record<string, any>;
}

export function useAppOptions(groupKey: string) {
  const { language } = useLanguage();
  const { data = [], isLoading } = useQuery({
    queryKey: ["app_options", groupKey],
    queryFn: async () => {
      if (!groupKey) return [];
      const { data, error } = await supabase
        .from("app_options")
        .select("*")
        .eq("group_key", groupKey)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!groupKey,
    staleTime: 0,
    gcTime: 0,
  });

  const options: AppOption[] = useMemo(
    () =>
      data.map((o: any) => ({
        value: o.value_key,
        label: language === "tr" ? o.label_tr : o.label_en,
        emoji: o.emoji || null,
        metadata: (o.metadata as Record<string, any>) || {},
      })),
    [data, language]
  );

  return { options, isLoading };
}
