import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { icon as leafletIcon, divIcon } from "leaflet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";

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

function createPetIcon(species: string, photoUrl?: string) {
  const color = speciesColor[species] || "#6B7280";
  const emoji = speciesEmoji[species] || "🐾";

  return divIcon({
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
  onWoof?: (pet: any) => void;
}

const PetMap = ({ pets, onWoof }: PetMapProps) => {
  // Center on Beyoğlu / Cihangir area
  const center: [number, number] = [41.0325, 28.9800];

  // Filter pets that have coordinates
  const mappedPets = pets.filter((p) => p.latitude && p.longitude);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-border relative">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {mappedPets.map((pet) => (
          <Marker
            key={pet.id}
            position={[pet.latitude, pet.longitude]}
            icon={createPetIcon(pet.species, pet.photo_url)}
          >
            <Popup maxWidth={280} minWidth={220}>
              <div className="p-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {speciesEmoji[pet.species] || "🐾"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{pet.name}</h3>
                    <p className="text-xs text-gray-500">
                      {pet.breed || pet.species}
                      {pet.age_years ? ` • ${pet.age_years}y` : ""}
                      {pet.gender ? ` • ${pet.gender === "male" ? "♂" : "♀"}` : ""}
                    </p>
                    {pet.neighborhood && (
                      <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <span>📍</span> {pet.neighborhood}
                      </p>
                    )}
                  </div>
                </div>

                {pet.bio && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{pet.bio}</p>
                )}

                {pet.personality_tags && pet.personality_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pet.personality_tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {pet.size && (
                  <p className="text-[10px] text-gray-400 mb-2">
                    Size: {pet.size} {pet.energy_level && `• Energy: ${pet.energy_level}`}
                  </p>
                )}

                {onWoof && (
                  <button
                    onClick={() => onWoof(pet)}
                    className="w-full text-xs bg-blue-500 text-white rounded-md py-1.5 hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                  >
                    ❤️ Send a Woof
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
