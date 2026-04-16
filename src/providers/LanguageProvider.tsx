import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { config } from '@/config';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Language {
  code: string;
  name: string;
  native_name: string;
  direction: string;
}

interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  languages: Language[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: config.defaultLanguage,
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  languages: [],
  isLoading: true,
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('app_language') || config.defaultLanguage;
  });
  const userIdRef = useRef<string | null>(null);

  // Listen to auth state to load language preference from DB
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        userIdRef.current = session.user.id;
        // Fetch language_preference from profiles
        const { data } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('user_id', session.user.id)
          .single();
        if (data?.language_preference) {
          setLanguageState(data.language_preference);
          localStorage.setItem('app_language', data.language_preference);
        }
      } else {
        userIdRef.current = null;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: languages = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as Language[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: translations = {}, isLoading } = useQuery({
    queryKey: ['translations', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_code', language);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        map[row.translation_key] = row.translation_value;
      });
      return map;
    },
    staleTime: 1000 * 60 * 15,
  });

  const setLanguage = useCallback((lang: string) => {
    localStorage.setItem('app_language', lang);
    setLanguageState(lang);
    // Save to DB if logged in
    if (userIdRef.current) {
      supabase
        .from('profiles')
        .update({ language_preference: lang } as any)
        .eq('user_id', userIdRef.current)
        .then();
    }
  }, []);

  // Set document direction based on language
  useEffect(() => {
    const lang = languages.find(l => l.code === language);
    if (lang) {
      document.documentElement.dir = lang.direction || 'ltr';
      document.documentElement.lang = lang.code;
    }
  }, [language, languages]);

  const t = useCallback((key: string, fallback?: string) => {
    return (translations as Record<string, string>)[key] || fallback || key;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}
