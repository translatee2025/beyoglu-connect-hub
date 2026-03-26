import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PetFilters, { PetFilterState, defaultFilters } from "./PetFilters";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

const speciesEmoji: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🐦", rabbit: "🐇", fish: "🐟", other: "🐾",
};

const speciesColor: Record<string, string> = {
  dog: "#3B82F6", cat: "#F59E0B", bird: "#10B981", rabbit: "#8B5CF6", fish: "#06B6D4", other: "#6B7280",
};

// Venue data for Beyoğlu
const venues: {
  name: string; type: "petshop" | "vet"; lat: number; lng: number; address: string; phone?: string;
}[] = [
  { name: "PetCity Beyoğlu", type: "petshop", lat: 41.0340, lng: 28.9775, address: "İstiklal Cad. No:45", phone: "+90 212 555 0101" },
  { name: "Happy Paws Pet Shop", type: "petshop", lat: 41.0310, lng: 28.9830, address: "Cihangir Mah. Akarsu Sok. No:12" },
  { name: "Beyoğlu Veteriner", type: "vet", lat: 41.0355, lng: 28.9790, address: "Tomtom Mah. No:8", phone: "+90 212 555 0202" },
  { name: "Dr. Pati Vet Clinic", type: "vet", lat: 41.0295, lng: 28.9850, address: "Firuzağa Mah. No:22", phone: "+90 212 555 0303" },
  { name: "PetLand Store", type: "petshop", lat: 41.0365, lng: 28.9810, address: "Galatasaray, İstiklal Cad. No:120" },
  { name: "İstanbul Vet Center", type: "vet", lat: 41.0330, lng: 28.9760, address: "Asmalımescit Mah. No:5", phone: "+90 212 555 0404" },
];

function createPetIcon(species: string, photoUrl?: string | null, isLost?: boolean, isFound?: boolean) {
  const color = isLost ? "#DC2626" : isFound ? "#16A34A" : (speciesColor[species] || "#6B7280");
  const emoji = speciesEmoji[species] || "🐾";
  const borderColor = isLost ? "#FEE2E2" : isFound ? "#DCFCE7" : "white";
  const pulseRing = (isLost || isFound) ? `
    <div style="
      position: absolute; top: -8px; left: -8px;
      width: 60px; height: 60px; border-radius: 50%;
      background: ${isLost ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.2)"};
      animation: lostPulse 2s ease-in-out infinite;
    "></div>` : "";

  const label = isLost ? "LOST" : isFound ? "FOUND" : "";
  const labelHtml = label ? `<div style="
    position: absolute; top: -10px; right: -10px; z-index: 3;
    background: ${color}; color: white; font-size: 10px; font-weight: 700;
    padding: 1px 5px; border-radius: 4px; white-space: nowrap;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  ">${label}</div>` : "";

  return L.divIcon({
    className: "pet-marker-icon",
    html: `
      <div style="position: relative;">
        ${pulseRing}
        <div style="
          position: relative; z-index: 2;
          width: 44px; height: 44px; border-radius: 50%;
          background: ${color}; border: 3px solid ${borderColor};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; cursor: pointer;
          ${photoUrl ? `background-image: url(${photoUrl}); background-size: cover; background-position: center;` : ""}
        ">${photoUrl ? "" : emoji}</div>
        <div style="
          position: relative; z-index: 2;
          width: 12px; height: 12px; background: ${color};
          transform: rotate(45deg); margin: -8px auto 0;
          border-right: 3px solid ${borderColor};
          border-bottom: 3px solid ${borderColor};
          box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        "></div>
        ${labelHtml}
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -56],
  });
}

function createVenueIcon(type: "petshop" | "vet") {
  const color = type === "vet" ? "#E11D48" : "#7C3AED";
  const icon = type === "vet" ? "🏥" : "🛒";
  return L.divIcon({
    className: "venue-marker-icon",
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 8px;
        background: ${color}; border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; cursor: pointer;
      ">${icon}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// Inject CSS
const styleId = "pet-map-pulse-style";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes lostPulse {
      0% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.4); opacity: 0; }
      100% { transform: scale(1); opacity: 0.6; }
    }
  `;
  document.head.appendChild(style);
}

function matchesFilters(pet: any, filters: PetFilterState): boolean {
  if (filters.species !== "all" && pet.species !== filters.species) return false;
  if (filters.size !== "all" && pet.size !== filters.size) return false;
  if (filters.gender !== "all" && pet.gender !== filters.gender) return false;
  if (filters.personality !== "all" && !(pet.personality_tags || []).includes(filters.personality)) return false;
  if (filters.energyLevel !== "all" && pet.energy_level !== filters.energyLevel) return false;
  if (filters.ageRange !== "all") {
    const y = pet.age_years || 0;
    if (filters.ageRange === "puppy" && y > 1) return false;
    if (filters.ageRange === "young" && (y < 1 || y > 3)) return false;
    if (filters.ageRange === "adult" && (y < 3 || y > 8)) return false;
    if (filters.ageRange === "senior" && y < 8) return false;
  }
  return true;
}

interface PetMapProps {
  pets: any[];
  showFilters?: boolean;
}

const PetMap = ({ pets, showFilters = true }: PetMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [filters, setFilters] = useState<PetFilterState>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const mappedPets = pets.filter((p) => p.latitude && p.longitude);
  const filteredPets = mappedPets.filter((p) => matchesFilters(p, filters));

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [41.0325, 28.9800],
      zoom: 15,
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
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    // Venues
    venues.forEach((v) => {
      const marker = L.marker([v.lat, v.lng], { icon: createVenueIcon(v.type) }).addTo(map);
      marker.bindPopup(`
        <div style="min-width:180px;font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${v.type === "vet" ? "🏥" : "🛒"} ${v.name}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">📍 ${v.address}</div>
          ${v.phone ? `<div style="font-size:12px;color:#6b7280;">📞 ${v.phone}</div>` : ""}
          <div style="margin-top:6px;font-size:11px;padding:3px 8px;background:${v.type === "vet" ? "#FEE2E2" : "#F3E8FF"};border-radius:4px;display:inline-block;font-weight:600;color:${v.type === "vet" ? "#BE123C" : "#7C3AED"};">
            ${v.type === "vet" ? "Veterinary Clinic" : "Pet Shop"}
          </div>
        </div>
      `, { maxWidth: 250 });
    });

    // Pets
    const sorted = [...filteredPets].sort((a, b) => (a.is_lost ? 1 : 0) - (b.is_lost ? 1 : 0));
    sorted.forEach((pet) => {
      const isFound = !pet.is_lost && pet.lost_location; // found pets have location but aren't lost
      const marker = L.marker([pet.latitude, pet.longitude], {
        icon: createPetIcon(pet.species, pet.photo_url, pet.is_lost, false),
        zIndexOffset: pet.is_lost ? 1000 : 0,
      }).addTo(map);

      const popupContent = pet.is_lost ? `
        <div style="min-width:220px;max-width:280px;font-family:system-ui,sans-serif;">
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px;margin-bottom:8px;">
            <span style="background:#DC2626;color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;">🚨 LOST PET</span>
            <div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
              <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;background:#fee2e2;flex-shrink:0;border:2px solid #DC2626;">
                ${pet.photo_url ? `<img src="${pet.photo_url}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;">${speciesEmoji[pet.species] || "🐾"}</div>`}
              </div>
              <div>
                <div style="font-weight:700;font-size:16px;color:#991B1B;">${pet.name}</div>
                <div style="font-size:12px;color:#6b7280;">${pet.breed || pet.species}${pet.gender ? ` • ${pet.gender === "male" ? "♂" : "♀"}` : ""}</div>
              </div>
            </div>
          </div>
          ${pet.lost_details ? `<p style="font-size:12px;color:#4b5563;margin:0 0 6px;line-height:1.4;">${pet.lost_details.slice(0, 150)}</p>` : ""}
          ${pet.lost_location ? `<div style="font-size:11px;color:#9ca3af;margin-bottom:8px;">📍 ${pet.lost_location}</div>` : ""}
          <div style="background:#DC2626;color:white;text-align:center;padding:6px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">📞 I've Seen This Pet!</div>
        </div>
      ` : `
        <div style="min-width:200px;max-width:260px;font-family:system-ui,sans-serif;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:50px;height:50px;border-radius:50%;overflow:hidden;background:#f3f4f6;flex-shrink:0;">
              ${pet.photo_url ? `<img src="${pet.photo_url}" style="width:100%;height:100%;object-fit:cover;" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;">${speciesEmoji[pet.species] || "🐾"}</div>`}
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;">${pet.name}</div>
              <div style="font-size:12px;color:#6b7280;">${pet.breed || pet.species}${pet.age_years ? ` • ${pet.age_years}y` : ""}${pet.gender ? ` • ${pet.gender === "male" ? "♂" : "♀"}` : ""}</div>
              ${pet.neighborhood ? `<div style="font-size:11px;color:#9ca3af;">📍 ${pet.neighborhood}</div>` : ""}
            </div>
          </div>
          ${pet.bio ? `<p style="font-size:12px;color:#4b5563;margin:0 0 6px;line-height:1.4;">${pet.bio.slice(0, 100)}</p>` : ""}
          ${pet.personality_tags?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">${pet.personality_tags.slice(0, 3).map((t: string) => `<span style="font-size:10px;padding:2px 8px;border-radius:999px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;">${t}</span>`).join("")}</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
    });
  }, [filteredPets]);

  const lostCount = filteredPets.filter((p) => p.is_lost).length;

  return (
    <div className="relative space-y-3">
      {/* Filter toggle */}
      {showFilters && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="gap-2 text-xs">
            <Filter className="w-3 h-3" />
            {filtersOpen ? "Hide Filters" : "Show Filters"}
          </Button>
          {filtersOpen && (
            <div className="mt-2 p-3 rounded-lg border border-border bg-card">
              <PetFilters filters={filters} onChange={setFilters} />
            </div>
          )}
        </div>
      )}

      <div ref={mapRef} className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-border" />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md z-[1000] text-xs">
        <p className="font-semibold mb-1">Map Legend</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(speciesEmoji).filter(([k]) => k !== "other").map(([species, emoji]) => (
            <span key={species} className="flex items-center gap-0.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: speciesColor[species] }} />
              {emoji}
            </span>
          ))}
          <span className="flex items-center gap-0.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#DC2626" }} /> 🚨 Lost
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-3 h-3 rounded inline-block" style={{ background: "#7C3AED" }} /> 🛒 Shop
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-3 h-3 rounded inline-block" style={{ background: "#E11D48" }} /> 🏥 Vet
          </span>
        </div>
      </div>

      {lostCount > 0 && (
        <div className="absolute top-3 left-3 right-3 bg-destructive/90 backdrop-blur-sm text-white rounded-lg px-3 py-2 shadow-lg z-[1000] text-sm font-medium flex items-center gap-2">
          <span className="animate-pulse">🚨</span>
          {lostCount} lost pet{lostCount > 1 ? "s" : ""} reported nearby — tap red pins to help!
        </div>
      )}
    </div>
  );
};

export default PetMap;
