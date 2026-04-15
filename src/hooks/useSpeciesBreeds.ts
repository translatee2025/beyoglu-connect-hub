import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/providers/LanguageProvider";
import { useMemo } from "react";

export interface Species {
  id: string;
  name_en: string;
  name_tr: string;
  emoji: string;
  display_order: number;
}

export interface Breed {
  id: string;
  species_id: string;
  name_en: string;
  name_tr: string;
  is_popular: boolean;
}

export function useSpecies() {
  const { language } = useLanguage();

  const { data: species = [], isLoading } = useQuery({
    queryKey: ["species"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("species")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Species[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const speciesOptions = useMemo(
    () =>
      species.map((s) => ({
        value: s.name_en.toLowerCase(),
        label: `${s.emoji} ${language === "tr" ? s.name_tr : s.name_en}`,
        id: s.id,
        emoji: s.emoji,
      })),
    [species, language]
  );

  const speciesEmojiMap = useMemo(
    () => Object.fromEntries(species.map((s) => [s.name_en.toLowerCase(), s.emoji])),
    [species]
  );

  return { species, speciesOptions, speciesEmojiMap, isLoading };
}

export function useBreeds(speciesValue?: string) {
  const { language } = useLanguage();
  const { species } = useSpecies();

  const speciesId = useMemo(() => {
    if (!speciesValue) return null;
    const found = species.find(
      (s) => s.name_en.toLowerCase() === speciesValue.toLowerCase()
    );
    return found?.id ?? null;
  }, [species, speciesValue]);

  const { data: breeds = [], isLoading } = useQuery({
    queryKey: ["breeds", speciesId],
    queryFn: async () => {
      if (!speciesId) return [];
      const { data, error } = await supabase
        .from("breeds")
        .select("*")
        .eq("species_id", speciesId)
        .order("is_popular", { ascending: false })
        .order("name_en");
      if (error) throw error;
      return data as Breed[];
    },
    enabled: !!speciesId,
    staleTime: 1000 * 60 * 60,
  });

  const breedOptions = useMemo(
    () =>
      breeds.map((b) => ({
        value: language === "tr" ? b.name_tr : b.name_en,
        label: language === "tr" ? b.name_tr : b.name_en,
        id: b.id,
        is_popular: b.is_popular,
      })),
    [breeds, language]
  );

  return { breeds, breedOptions, isLoading };
}
