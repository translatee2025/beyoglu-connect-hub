import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const speciesEmoji: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🐦", rabbit: "🐇", fish: "🐟", other: "🐾",
};

const speciesColor: Record<string, string> = {
  dog: "#3B82F6",
  cat: "#F59E0B",
  bird: "#10B981",
  rabbit: "#8B5CF6",
  fish: "#06B6D4",
  other: "#6B7280",
};

function createPetIcon(species: string, photoUrl?: string | null, isLost?: boolean) {
  const color = isLost ? "#DC2626" : (speciesColor[species] || "#6B7280");
  const emoji = speciesEmoji[species] || "🐾";
  const pulseRing = isLost ? `
    <div style="
      position: absolute; top: -8px; left: -8px;
      width: 60px; height: 60px; border-radius: 50%;
      background: rgba(220, 38, 38, 0.2);
      animation: lostPulse 2s ease-in-out infinite;
    "></div>
  ` : "";

  return L.divIcon({
    className: isLost ? "pet-marker-icon pet-marker-lost" : "pet-marker-icon",
    html: `
      <div style="position: relative;">
        ${pulseRing}
        <div style="
          position: relative; z-index: 2;
          width: 44px; height: 44px; border-radius: 50%;
          background: ${color}; border: 3px solid ${isLost ? "#FEE2E2" : "white"};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3)${isLost ? ", 0 0 16px rgba(220,38,38,0.5)" : ""};
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; cursor: pointer;
          ${photoUrl ? `background-image: url(${photoUrl}); background-size: cover; background-position: center;` : ""}
        ">
          ${photoUrl ? "" : emoji}
        </div>
        <div style="
          position: relative; z-index: 2;
          width: 12px; height: 12px; background: ${color};
          transform: rotate(45deg); margin: -8px auto 0;
          border-right: 3px solid ${isLost ? "#FEE2E2" : "white"};
          border-bottom: 3px solid ${isLost ? "#FEE2E2" : "white"};
          box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        "></div>
        ${isLost ? `<div style="
          position: absolute; top: -10px; right: -10px; z-index: 3;
          background: #DC2626; color: white; font-size: 10px; font-weight: 700;
          padding: 1px 5px; border-radius: 4px; white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        ">LOST</div>` : ""}
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -56],
  });
}

// Inject CSS animation for lost pet pulse
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

interface PetMapProps {
  pets: any[];
}

const PetMap = ({ pets }: PetMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const mappedPets = pets.filter((p) => p.latitude && p.longitude);

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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    // Sort so lost pets render on top
    const sorted = [...mappedPets].sort((a, b) => (a.is_lost ? 1 : 0) - (b.is_lost ? 1 : 0));

    sorted.forEach((pet) => {
      const marker = L.marker([pet.latitude, pet.longitude], {
        icon: createPetIcon(pet.species, pet.photo_url, pet.is_lost),
        zIndexOffset: pet.is_lost ? 1000 : 0,
      }).addTo(map);

      const isLost = pet.is_lost;

      const popupContent = isLost
        ? `
          <div style="min-width: 220px; max-width: 280px; font-family: system-ui, sans-serif;">
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                <span style="background: #DC2626; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">🚨 LOST PET</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 56px; height: 56px; border-radius: 50%; overflow: hidden; background: #fee2e2; flex-shrink: 0; border: 2px solid #DC2626;">
                  ${pet.photo_url
                    ? `<img src="${pet.photo_url}" alt="${pet.name}" style="width: 100%; height: 100%; object-fit: cover;" />`
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px;">${speciesEmoji[pet.species] || "🐾"}</div>`
                  }
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 16px; color: #991B1B;">${pet.name}</div>
                  <div style="font-size: 12px; color: #6b7280;">
                    ${pet.breed || pet.species}${pet.gender ? ` • ${pet.gender === "male" ? "♂" : "♀"}` : ""}
                  </div>
                </div>
              </div>
            </div>
            ${pet.lost_details ? `<p style="font-size: 12px; color: #4b5563; margin: 0 0 6px; line-height: 1.4;">${pet.lost_details.slice(0, 150)}${pet.lost_details.length > 150 ? "..." : ""}</p>` : ""}
            ${pet.lost_location ? `<div style="font-size: 11px; color: #9ca3af; margin-bottom: 8px;">📍 Last seen: ${pet.lost_location}</div>` : ""}
            ${pet.lost_at ? `<div style="font-size: 10px; color: #9ca3af; margin-bottom: 8px;">🕐 ${new Date(pet.lost_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>` : ""}
            <div style="background: #DC2626; color: white; text-align: center; padding: 6px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              📞 I've Seen This Pet!
            </div>
          </div>
        `
        : `
          <div style="min-width: 200px; max-width: 260px; font-family: system-ui, sans-serif;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; background: #f3f4f6; flex-shrink: 0;">
                ${pet.photo_url
                  ? `<img src="${pet.photo_url}" alt="${pet.name}" style="width: 100%; height: 100%; object-fit: cover;" />`
                  : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px;">${speciesEmoji[pet.species] || "🐾"}</div>`
                }
              </div>
              <div>
                <div style="font-weight: 700; font-size: 15px;">${pet.name}</div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${pet.breed || pet.species}${pet.age_years ? ` • ${pet.age_years}y` : ""}${pet.gender ? ` • ${pet.gender === "male" ? "♂" : "♀"}` : ""}
                </div>
                ${pet.neighborhood ? `<div style="font-size: 11px; color: #9ca3af;">📍 ${pet.neighborhood}</div>` : ""}
              </div>
            </div>
            ${pet.bio ? `<p style="font-size: 12px; color: #4b5563; margin: 0 0 6px; line-height: 1.4;">${pet.bio.slice(0, 100)}${pet.bio.length > 100 ? "..." : ""}</p>` : ""}
            ${pet.personality_tags?.length ? `
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
                ${pet.personality_tags.slice(0, 3).map((tag: string) => `
                  <span style="font-size: 10px; padding: 2px 8px; border-radius: 999px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;">${tag}</span>
                `).join("")}
              </div>
            ` : ""}
            ${pet.size ? `<div style="font-size: 10px; color: #9ca3af;">Size: ${pet.size}${pet.energy_level ? ` • Energy: ${pet.energy_level}` : ""}</div>` : ""}
          </div>
        `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
    });
  }, [mappedPets]);

  const lostCount = mappedPets.filter((p) => p.is_lost).length;

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-border"
      />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md z-[1000] text-xs">
        <p className="font-semibold mb-1">Pets nearby</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(speciesEmoji).filter(([k]) => k !== "other").map(([species, emoji]) => (
            <span key={species} className="flex items-center gap-0.5">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ background: speciesColor[species] }}
              />
              {emoji}
            </span>
          ))}
          <span className="flex items-center gap-0.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#DC2626" }} />
            🚨 Lost
          </span>
        </div>
      </div>

      {/* Lost pet alert banner */}
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
