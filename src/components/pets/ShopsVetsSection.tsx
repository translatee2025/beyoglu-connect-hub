import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLocation as useLocationCtx } from "@/providers/LocationProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ShopVetItem {
  id: string;
  name: string;
  type: "shop" | "vet";
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const hardcodedVenues: ShopVetItem[] = [
  { id: "hc-1", name: "PetCity Beyoğlu", type: "shop", address: "İstiklal Cad. No:45", phone: "+90 212 555 0101", lat: 41.034, lng: 28.9775, created_at: "2025-01-01T00:00:00Z" },
  { id: "hc-2", name: "Happy Paws Pet Shop", type: "shop", address: "Cihangir Mah. Akarsu Sok. No:12", phone: null, lat: 41.031, lng: 28.983, created_at: "2025-01-02T00:00:00Z" },
  { id: "hc-3", name: "PetLand Store", type: "shop", address: "Galatasaray, İstiklal Cad. No:120", phone: null, lat: 41.0365, lng: 28.981, created_at: "2025-01-03T00:00:00Z" },
  { id: "hc-4", name: "Beyoğlu Veteriner", type: "vet", address: "Tomtom Mah. No:8", phone: "+90 212 555 0202", lat: 41.0355, lng: 28.979, created_at: "2025-01-04T00:00:00Z" },
  { id: "hc-5", name: "Dr. Pati Vet Clinic", type: "vet", address: "Firuzağa Mah. No:22", phone: "+90 212 555 0303", lat: 41.0295, lng: 28.985, created_at: "2025-01-05T00:00:00Z" },
  { id: "hc-6", name: "İstanbul Vet Center", type: "vet", address: "Asmalımescit Mah. No:5", phone: "+90 212 555 0404", lat: 41.033, lng: 28.976, created_at: "2025-01-06T00:00:00Z" },
];

const ShopsVetsSection = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "nearest" | "popular">("newest");
  const [view, setView] = useState<"list" | "map">("list");
  const loc = useLocationCtx();
  const userLat = loc?.lat ?? null;
  const userLng = loc?.lng ?? null;

  const { data: dbPosts = [] } = useQuery({
    queryKey: ["pet-posts-shops-vets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_posts")
        .select("*")
        .in("post_type", ["shop", "vet"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allItems = useMemo<ShopVetItem[]>(() => {
    const fromDb: ShopVetItem[] = dbPosts.map((p: any) => ({
      id: p.id,
      name: p.title,
      type: p.post_type as "shop" | "vet",
      address: p.address,
      phone: p.phone,
      lat: p.lat,
      lng: p.lng,
      created_at: p.created_at,
    }));
    return [...fromDb, ...hardcodedVenues];
  }, [dbPosts]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.address || "").toLowerCase().includes(q)
      );
    }
    if (sort === "newest") {
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "nearest" && userLat && userLng) {
      list = [...list].sort((a, b) => {
        const da = a.lat && a.lng ? haversine(userLat!, userLng!, a.lat, a.lng) : 9999;
        const db = b.lat && b.lng ? haversine(userLat!, userLng!, b.lat, b.lng) : 9999;
        return da - db;
      });
    } else {
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [allItems, search, sort, userLat, userLng]);

  const distanceText = useCallback(
    (lat: number | null, lng: number | null) => {
      if (!userLat || !userLng || !lat || !lng) return null;
      const d = haversine(userLat, userLng, lat, lng);
      return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
    },
    [userLat, userLng]
  );

  const pillStyle = (active: boolean) => ({
    backgroundColor: active ? "#1E3A5F" : "white",
    color: active ? "white" : "#64748B",
    border: `0.5px solid ${active ? "#1E3A5F" : "#E2EBFC"}`,
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94A3B8" }} />
        <Input
          placeholder={t("pets.shops_search", "Search stores or clinics...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          style={{ border: "1px solid #E2EBFC" }}
        />
      </div>

      {/* Sort + view toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: "newest" as const, label: t("sort.newest", "Newest") },
          { key: "nearest" as const, label: t("sort.nearby", "Nearby") },
          { key: "popular" as const, label: t("sort.popular", "Popular") },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            disabled={s.key === "nearest" && !userLat}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-40"
            style={pillStyle(sort === s.key)}
          >
            {s.label}
          </button>
        ))}

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setView("list")}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={pillStyle(view === "list")}
          >
            📋 {t("common.list", "List")}
          </button>
          <button
            onClick={() => setView("map")}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={pillStyle(view === "map")}
          >
            🗺️ {t("common.map", "Map")}
          </button>
        </div>
      </div>

      {view === "list" ? (
        filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏥</div>
            <p className="text-sm font-medium" style={{ color: "#1E3A5F" }}>{t("pets.shops_empty", "No stores or clinics found")}</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{t("pets.shops_empty_hint", "Try changing your search.")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const dist = distanceText(item.lat, item.lng);
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white"
                  style={{ border: "1px solid #E2EBFC" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[13px]" style={{ color: "#1E3A5F" }}>
                      {item.name}
                    </span>
                    <Badge
                      className="text-[10px] px-1.5 py-0 h-4"
                      style={{
                        backgroundColor: item.type === "shop" ? "#EFF4FF" : "#F0FDFA",
                        color: item.type === "shop" ? "#1E3A5F" : "#0D9488",
                        border: "none",
                      }}
                    >
                      {item.type === "shop" ? t("pets.shop", "Pet Shop") : t("pets.vet", "Veterinarian")}
                    </Badge>
                  </div>

                  {item.address && (
                    <p className="text-[11px]" style={{ color: "#94A3B8" }}>📍 {item.address}</p>
                  )}

                  {item.phone && (
                    <a href={`tel:${item.phone}`} className="text-[11px] block mt-0.5" style={{ color: "#94A3B8" }}>
                      📞 {item.phone}
                    </a>
                  )}

                  {dist && (
                    <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>📏 {dist}</p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs h-7 px-4"
                    style={{ borderColor: "#1E3A5F", color: "#1E3A5F" }}
                  >
                    {t("common.details", "Details")}
                  </Button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <ShopsVetsMap items={filtered} />
      )}
    </div>
  );
};

/* ─── MAP ─── */

const ShopsVetsMap = ({ items }: { items: ShopVetItem[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [41.033, 28.9815],
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
      const color = item.type === "shop" ? "#1E3A5F" : "#0D9488";
      const emoji = item.type === "shop" ? "🛒" : "🏥";
      const typeLabel = item.type === "shop" ? t("pets.shop", "Pet Shop") : t("pets.vet", "Veterinarian");
      const badgeBg = item.type === "shop" ? "#EFF4FF" : "#F0FDFA";

      const icon = L.divIcon({
        className: "sv-pin",
        html: `<div style="
          width:36px;height:36px;border-radius:8px;
          background:${color};border:2px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
          font-size:18px;cursor:pointer;
        ">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="min-width:200px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:14px;color:#1E3A5F;margin-bottom:4px;">${item.name}</div>
          <div style="display:inline-block;font-size:10px;padding:2px 6px;border-radius:4px;background:${badgeBg};color:${color};font-weight:600;margin-bottom:6px;">${typeLabel}</div>
          ${item.address ? `<div style="font-size:11px;color:#94A3B8;margin-bottom:2px;">📍 ${item.address}</div>` : ""}
          ${item.phone ? `<div style="font-size:11px;color:#94A3B8;margin-bottom:6px;">📞 <a href="tel:${item.phone}" style="color:#1E3A5F;">${item.phone}</a></div>` : ""}
          <div style="
            text-align:center;padding:5px;border-radius:6px;
            border:1px solid #1E3A5F;color:#1E3A5F;
            font-size:11px;font-weight:600;cursor:pointer;
          ">${t("common.details", "Details")}</div>
        </div>
      `, { maxWidth: 280 });
    });
  }, [items]);

  return (
    <div ref={mapRef} className="w-full rounded-lg overflow-hidden shadow-lg" style={{ height: 500, border: "1px solid #E2EBFC" }} />
  );
};

export default ShopsVetsSection;
