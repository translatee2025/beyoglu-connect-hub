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

function createPetIcon(species: string, photoUrl?: string | null) {
  const color = speciesColor[species] || "#6B7280";
  const emoji = speciesEmoji[species] || "🐾";

  return L.divIcon({
    className: "pet-marker-icon",
    html: `
      <div style="
        width: 44px; height: 44px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; cursor: pointer;
        ${photoUrl ? `background-image: url(${photoUrl}); background-size: cover; background-position: center;` : ""}
      ">
        ${photoUrl ? "" : emoji}
      </div>
      <div style="
        width: 12px; height: 12px; background: ${color};
        transform: rotate(45deg); margin: -8px auto 0;
        border-right: 3px solid white; border-bottom: 3px solid white;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      "></div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -56],
  });
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

    mappedPets.forEach((pet) => {
      const marker = L.marker([pet.latitude, pet.longitude], {
        icon: createPetIcon(pet.species, pet.photo_url),
      }).addTo(map);

      const popupContent = `
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

      marker.bindPopup(popupContent, { maxWidth: 280 });
    });
  }, [mappedPets]);

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
        </div>
      </div>
    </div>
  );
};

export default PetMap;
