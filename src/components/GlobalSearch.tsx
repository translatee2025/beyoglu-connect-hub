import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Store, Calendar, MessageSquare, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/providers/LanguageProvider";

interface SearchResult {
  type: "venue" | "event" | "post" | "person";
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

const ICONS: Record<string, any> = { venue: Store, event: Calendar, post: MessageSquare, person: User };

const LABEL_MAP: Record<string, { en: string; tr: string }> = {
  venue: { en: "Venues", tr: "Mekanlar" },
  event: { en: "Events", tr: "Etkinlikler" },
  post: { en: "Posts", tr: "Gönderiler" },
  person: { en: "People", tr: "Kişiler" },
};
const makeGetLabel = (language: string) => (type: string) =>
  language === "tr" ? (LABEL_MAP[type]?.tr || type) : (LABEL_MAP[type]?.en || type);

export function GlobalSearchDesktop() {
  const { language } = useLanguage();
  const getLabel = makeGetLabel(language);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(() => doSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const doSearch = async (q: string) => {
    setLoading(true);
    const pattern = `%${q}%`;
    const all: SearchResult[] = [];

    const [venues, events, posts, people] = await Promise.all([
      supabase.from("venues").select("id, name, address").or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from("events").select("id, title, venue_name").eq("status", "active").or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from("wall_posts").select("id, content, user_id").ilike("content", pattern).limit(5),
      supabase.from("profiles").select("user_id, display_name, neighborhood").ilike("display_name", pattern).limit(5),
    ]);

    (venues.data || []).forEach(v => all.push({ type: "venue", id: v.id, title: v.name, subtitle: v.address || undefined, link: `/venue/${v.id}` }));
    (events.data || []).forEach(e => all.push({ type: "event", id: e.id, title: e.title, subtitle: e.venue_name || undefined, link: `/events/${e.id}` }));
    (posts.data || []).forEach(p => all.push({ type: "post", id: p.id, title: p.content?.slice(0, 50) || "Gönderi", link: "/wall" }));
    (people.data || []).forEach(p => all.push({ type: "person", id: p.user_id, title: p.display_name || "Kullanıcı", subtitle: p.neighborhood || undefined, link: `/profile/${p.user_id}` }));

    setResults(all);
    setLoading(false);
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] = acc[r.type] || []).push(r);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative px-3 pb-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Ara..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
          style={{ background: "#F1F5F9", border: "1px solid #E2EBFC", color: "#1E3A5F", fontSize: 12 }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3 h-3" style={{ color: "#94A3B8" }} />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto" style={{ borderColor: "#E2EBFC" }}>
          {loading ? (
            <div className="p-4 text-center" style={{ fontSize: 12, color: "#94A3B8" }}>Aranıyor...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center" style={{ fontSize: 12, color: "#94A3B8" }}>Sonuç bulunamadı. Başka bir kelime deneyin.</div>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              const Icon = ICONS[type];
              return (
                <div key={type}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", padding: "8px 12px 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {LABELS[type]}
                  </div>
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { navigate(item.link); setOpen(false); setQuery(""); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F1F5F9] transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#1E3A5F" }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate" style={{ fontSize: 13, color: "#1E3A5F", fontWeight: 500 }}>{item.title}</div>
                        {item.subtitle && <div className="truncate" style={{ fontSize: 11, color: "#94A3B8" }}>{item.subtitle}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function GlobalSearchMobile() {
  const { language } = useLanguage();
  const getLabel = makeGetLabel(language);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded && inputRef.current) inputRef.current.focus();
  }, [expanded]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(() => doSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const doSearch = async (q: string) => {
    setLoading(true);
    const pattern = `%${q}%`;
    const all: SearchResult[] = [];

    const [venues, events, posts, people] = await Promise.all([
      supabase.from("venues").select("id, name, address").or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from("events").select("id, title, venue_name").eq("status", "active").or(`title.ilike.${pattern},description.ilike.${pattern}`).limit(5),
      supabase.from("wall_posts").select("id, content, user_id").ilike("content", pattern).limit(5),
      supabase.from("profiles").select("user_id, display_name, neighborhood").ilike("display_name", pattern).limit(5),
    ]);

    (venues.data || []).forEach(v => all.push({ type: "venue", id: v.id, title: v.name, subtitle: v.address || undefined, link: `/venue/${v.id}` }));
    (events.data || []).forEach(e => all.push({ type: "event", id: e.id, title: e.title, subtitle: e.venue_name || undefined, link: `/events/${e.id}` }));
    (posts.data || []).forEach(p => all.push({ type: "post", id: p.id, title: p.content?.slice(0, 50) || "Gönderi", link: "/wall" }));
    (people.data || []).forEach(p => all.push({ type: "person", id: p.user_id, title: p.display_name || "Kullanıcı", subtitle: p.neighborhood || undefined, link: `/profile/${p.user_id}` }));

    setResults(all);
    setLoading(false);
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] = acc[r.type] || []).push(r);
    return acc;
  }, {});

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="p-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
        <Search className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white">
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#94A3B8" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Mekan, etkinlik, kişi ara..."
          className="flex-1 outline-none"
          style={{ fontSize: 14, color: "#1E3A5F" }}
        />
        <button onClick={() => { setExpanded(false); setQuery(""); setResults([]); }} style={{ fontSize: 13, color: "#E74C3C", fontWeight: 500 }}>İptal</button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
        {loading ? (
          <div className="p-6 text-center" style={{ fontSize: 13, color: "#94A3B8" }}>Aranıyor...</div>
        ) : query.length >= 2 && results.length === 0 ? (
          <div className="p-6 text-center" style={{ fontSize: 13, color: "#94A3B8" }}>Sonuç bulunamadı. Başka bir kelime deneyin.</div>
        ) : (
          Object.entries(grouped).map(([type, items]) => {
            const Icon = ICONS[type];
            return (
              <div key={type}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", padding: "12px 16px 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {LABELS[type]}
                </div>
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.link); setExpanded(false); setQuery(""); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F1F5F9] transition-colors text-left"
                    style={{ borderBottom: "1px solid #F1F5F9" }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" style={{ color: "#1E3A5F" }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate" style={{ fontSize: 14, color: "#1E3A5F", fontWeight: 500 }}>{item.title}</div>
                      {item.subtitle && <div className="truncate" style={{ fontSize: 12, color: "#94A3B8" }}>{item.subtitle}</div>}
                    </div>
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
