import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserName } from "@/components/shared/UserName";
import { useSpecies } from "@/hooks/useSpeciesBreeds";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}s önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

interface LostFoundSectionProps {
  onReport: () => void;
}

const LostFoundSection = ({ onReport }: LostFoundSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<"lost" | "found">("lost");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sort, setSort] = useState<"newest" | "nearest">("newest");
  const { speciesEmojiMap } = useSpecies();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["lost-found-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_found_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Also fetch pet_profiles that are marked as lost, plus pet_posts with type lost/found
  const { data: lostProfiles = [] } = useQuery({
    queryKey: ["lost-pet-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_profiles")
        .select("*")
        .eq("is_lost", true)
        .order("lost_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: lostPetPosts = [] } = useQuery({
    queryKey: ["lost-pet-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_posts")
        .select("*")
        .in("post_type", ["lost", "found"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Normalize all sources into a unified shape
  const allItems = useMemo(() => {
    const items: any[] = [];

    posts.forEach((p) => {
      if (p.category !== "Pet" && p.category !== "pet") return;
      items.push({
        id: p.id,
        type: p.type as "lost" | "found",
        title: p.title,
        species: null,
        breed: null,
        photo: p.photo_urls?.[0] || null,
        location: p.neighborhood || null,
        lat: p.last_seen_lat,
        lng: p.last_seen_lng,
        created_at: p.created_at,
        user_id: p.user_id,
        description: p.description,
      });
    });

    lostProfiles.forEach((p) => {
      items.push({
        id: `profile-${p.id}`,
        type: "lost" as const,
        title: p.name,
        species: p.species,
        breed: p.breed,
        photo: p.photo_url,
        location: p.lost_location || p.neighborhood,
        lat: p.latitude,
        lng: p.longitude,
        created_at: p.lost_at || p.created_at,
        user_id: p.owner_id,
        description: p.lost_details,
      });
    });

    lostPetPosts.forEach((p) => {
      items.push({
        id: `post-${p.id}`,
        type: p.post_type as "lost" | "found",
        title: p.title,
        species: p.species,
        breed: p.breed,
        photo: p.photos?.[0] || null,
        location: p.address,
        lat: p.lat,
        lng: p.lng,
        created_at: p.created_at,
        user_id: p.user_id,
        description: p.description,
      });
    });

    return items;
  }, [posts, lostProfiles, lostPetPosts]);

  const filtered = useMemo(() => {
    let list = allItems.filter((i) => i.type === typeFilter);
    if (sort === "newest") {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [allItems, typeFilter, sort]);

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  return (
    <div className="space-y-4">
      {/* Type filter: Kayıp / Bulundu */}
      <div className="flex gap-2">
        <button
          onClick={() => setTypeFilter("lost")}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: typeFilter === "lost" ? "#FEE2E2" : "#F8FAFF",
            color: typeFilter === "lost" ? "#DC2626" : "#64748B",
            border: `1px solid ${typeFilter === "lost" ? "#FECACA" : "#E2EBFC"}`,
          }}
        >
          🔴 Kayıp
        </button>
        <button
          onClick={() => setTypeFilter("found")}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: typeFilter === "found" ? "#DCFCE7" : "#F8FAFF",
            color: typeFilter === "found" ? "#16A34A" : "#64748B",
            border: `1px solid ${typeFilter === "found" ? "#BBF7D0" : "#E2EBFC"}`,
          }}
        >
          🟢 Bulundu
        </button>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("list")}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{
            backgroundColor: viewMode === "list" ? "#1E3A5F" : "white",
            color: viewMode === "list" ? "white" : "#64748B",
            border: `0.5px solid ${viewMode === "list" ? "#1E3A5F" : "#E2EBFC"}`,
          }}
        >
          📋 Liste
        </button>
        <button
          onClick={() => setViewMode("map")}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{
            backgroundColor: viewMode === "map" ? "#1E3A5F" : "white",
            color: viewMode === "map" ? "white" : "#64748B",
            border: `0.5px solid ${viewMode === "map" ? "#1E3A5F" : "#E2EBFC"}`,
          }}
        >
          🗺️ Harita
        </button>
        <Button variant="destructive" size="sm" className="ml-auto gap-1 text-xs" onClick={onReport}>
          + Bildir
        </Button>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Sort pills */}
          <div className="flex gap-2">
            {[
              { key: "newest" as const, label: "En Yeni" },
              { key: "nearest" as const, label: "Yakınımda" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: sort === s.key ? "#1E3A5F" : "white",
                  color: sort === s.key ? "white" : "#64748B",
                  border: `0.5px solid ${sort === s.key ? "#1E3A5F" : "#E2EBFC"}`,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">{typeFilter === "lost" ? "✅" : "📭"}</div>
              <p className="text-sm font-medium" style={{ color: "#1E3A5F" }}>
                {typeFilter === "lost" ? "Kayıp hayvan yok" : "Bulunan hayvan yok"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Şu anda aktif ilan bulunmuyor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-xl bg-white"
                  style={{ border: "1px solid #E2EBFC" }}
                >
                  {/* Photo */}
                  <div
                    className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{
                      width: 80,
                      height: 80,
                      backgroundColor: item.photo ? undefined : "#EFF4FF",
                    }}
                  >
                    {item.photo ? (
                      <img src={item.photo} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{speciesEmojiMap[item.species] || "🐾"}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-[13px] truncate" style={{ color: "#1E3A5F" }}>
                        {item.title}
                      </span>
                      <Badge
                        className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
                        style={{
                          backgroundColor: item.type === "lost" ? "#FEE2E2" : "#DCFCE7",
                          color: item.type === "lost" ? "#DC2626" : "#16A34A",
                          border: "none",
                        }}
                      >
                        {item.type === "lost" ? "Kayıp" : "Bulundu"}
                      </Badge>
                    </div>

                    {(item.species || item.breed) && (
                      <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                        {[item.species, item.breed].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    {item.location && (
                      <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                        📍 {item.location}
                      </p>
                    )}

                    <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                      {getTimeAgo(item.created_at)}
                    </p>

                    <button
                      onClick={() => item.user_id && handleContact(item.user_id)}
                      className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: "#E74C3C" }}
                    >
                      İletişim
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <LostFoundMap items={filtered} speciesEmojiMap={speciesEmojiMap} onContact={handleContact} />
      )}
    </div>
  );
};

/* ─── MAP ─── */

const speciesPinColor: Record<string, string> = {
  dog: "#F97316",
  cat: "#3B82F6",
  bird: "#22C55E",
  rabbit: "#8B5CF6",
};

const LostFoundMap = ({
  items,
  speciesEmojiMap,
  onContact,
}: {
  items: any[];
  speciesEmojiMap: Record<string, string>;
  onContact: (userId: string) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [41.0330, 28.9815],
      zoom: 14,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.eachLayer((l) => { if (l instanceof L.Marker) map.removeLayer(l); });

    items.forEach((item) => {
      if (!item.lat || !item.lng) return;
      const species = (item.species || "").toLowerCase();
      const color = speciesPinColor[species] || "#94A3B8";
      const emoji = speciesEmojiMap[species] || "🐾";

      const icon = L.divIcon({
        className: "lf-pin",
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:${color};border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:18px;cursor:pointer;
          ${item.photo ? `background-image:url(${item.photo});background-size:cover;background-position:center;` : ""}
        ">${item.photo ? "" : emoji}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);

      const photoHtml = item.photo
        ? `<img src="${item.photo}" style="width:60px;height:60px;border-radius:6px;object-fit:cover;flex-shrink:0;" />`
        : `<div style="width:60px;height:60px;border-radius:6px;background:#EFF4FF;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">${emoji}</div>`;

      marker.bindPopup(`
        <div style="min-width:200px;font-family:system-ui,sans-serif;">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
            ${photoHtml}
            <div>
              <div style="font-weight:700;font-size:14px;color:#1E3A5F;">${item.title}</div>
              <div style="font-size:11px;color:#94A3B8;">${item.species || ""}</div>
              <div style="font-size:11px;color:#94A3B8;">${item.created_at ? getTimeAgo(item.created_at) : ""}</div>
            </div>
          </div>
          <button onclick="window.__lfContact__('${item.user_id}')" style="
            width:100%;padding:6px;border:none;border-radius:6px;
            background:#E74C3C;color:white;font-size:12px;font-weight:600;cursor:pointer;
          ">İletişim</button>
        </div>
      `, { maxWidth: 280 });
    });
  }, [items, speciesEmojiMap]);

  // Global callback for popup button
  useEffect(() => {
    (window as any).__lfContact__ = (userId: string) => onContact(userId);
    return () => { delete (window as any).__lfContact__; };
  }, [onContact]);

  return (
    <div ref={mapRef} className="w-full rounded-lg overflow-hidden shadow-lg" style={{ height: 500, border: "1px solid #E2EBFC" }} />
  );
};

export default LostFoundSection;
