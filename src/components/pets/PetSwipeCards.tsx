import { useState, useMemo } from "react";
import { Heart, X, MapPin, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const personalityColors: Record<string, string> = {
  friendly: "bg-green-100 text-green-800",
  energetic: "bg-orange-100 text-orange-800",
  calm: "bg-blue-100 text-blue-800",
  shy: "bg-purple-100 text-purple-800",
  playful: "bg-yellow-100 text-yellow-800",
  protective: "bg-red-100 text-red-800",
  curious: "bg-teal-100 text-teal-800",
  independent: "bg-gray-100 text-gray-800",
};

const speciesEmoji: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🐦", rabbit: "🐇", fish: "🐟", other: "🐾",
};

interface PetSwipeCardsProps {
  pets: any[];
}

const CENTER_LAT = 41.0325;
const CENTER_LNG = 28.9800;

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PetSwipeCards = ({ pets }: PetSwipeCardsProps) => {
  const availablePets = useMemo(
    () => pets.filter((p) => !p.is_lost && p.photo_url),
    [pets]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);

  const pet = availablePets[currentIndex];

  const handleAction = (action: "like" | "pass") => {
    if (!pet) return;
    setSwipeDir(action === "like" ? "right" : "left");
    setTimeout(() => {
      if (action === "like") setLiked((l) => [...l, pet.id]);
      else setPassed((p) => [...p, pet.id]);
      setCurrentIndex((i) => i + 1);
      setSwipeDir(null);
    }, 300);
  };

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-6xl mb-4">🐾</span>
        <h3 className="text-xl font-semibold text-foreground mb-2">No more pets to discover!</h3>
        <p className="text-muted-foreground mb-2">
          You've liked {liked.length} pet{liked.length !== 1 ? "s" : ""}.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setCurrentIndex(0);
            setLiked([]);
            setPassed([]);
          }}
        >
          Start Over
        </Button>
      </div>
    );
  }

  const dist = pet.latitude && pet.longitude
    ? getDistance(CENTER_LAT, CENTER_LNG, pet.latitude, pet.longitude).toFixed(1)
    : null;

  return (
    <div className="flex flex-col items-center">
      {/* Progress */}
      <div className="text-xs text-muted-foreground mb-3">
        {currentIndex + 1} / {availablePets.length} • ❤️ {liked.length} liked
      </div>

      {/* Card */}
      <div
        className={`relative w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-border bg-card transition-transform duration-300 ${
          swipeDir === "left" ? "-translate-x-full rotate-[-12deg] opacity-0" :
          swipeDir === "right" ? "translate-x-full rotate-[12deg] opacity-0" : ""
        }`}
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-muted">
          <img
            src={pet.photo_url}
            alt={pet.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {pet.name}
                  {pet.gender && (
                    <span className="ml-2 text-lg opacity-80">
                      {pet.gender === "male" ? "♂" : "♀"}
                    </span>
                  )}
                </h2>
                <p className="text-sm opacity-90">
                  {pet.breed || pet.species}
                  {pet.age_years ? ` • ${pet.age_years}y` : ""}
                  {pet.age_months ? ` ${pet.age_months}m` : ""}
                </p>
              </div>
              <span className="text-3xl">{speciesEmoji[pet.species] || "🐾"}</span>
            </div>

            {dist && (
              <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                <MapPin className="w-3 h-3" />
                {dist} km away
                {pet.neighborhood && ` • ${pet.neighborhood}`}
              </div>
            )}
          </div>

          {/* Top badges */}
          {pet.size && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white/90 text-foreground text-xs backdrop-blur-sm">
                {pet.size === "small" ? "🐕 Small" : pet.size === "medium" ? "🐕 Medium" : "🐕 Large"}
              </Badge>
            </div>
          )}
          {pet.energy_level && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 text-foreground text-xs backdrop-blur-sm gap-1">
                <Zap className="w-3 h-3" />
                {pet.energy_level}
              </Badge>
            </div>
          )}
        </div>

        {/* Details section */}
        <div className="p-4 space-y-3">
          {pet.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{pet.bio}</p>
          )}

          {pet.personality_tags && pet.personality_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pet.personality_tags.map((tag: string) => (
                <span
                  key={tag}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${personalityColors[tag] || "bg-muted text-muted-foreground"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(pet.looking_for?.length > 0 || pet.gender_preference || pet.size_preference?.length > 0) && (
            <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border">
              <p className="font-medium text-foreground flex items-center gap-1">
                <Info className="w-3 h-3" /> Looking for
              </p>
              <div className="flex flex-wrap gap-1">
                {pet.looking_for?.map((l: string) => (
                  <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
                ))}
                {pet.gender_preference && pet.gender_preference !== "any" && (
                  <Badge variant="outline" className="text-[10px]">
                    {pet.gender_preference === "male" ? "♂ males only" : "♀ females only"}
                  </Badge>
                )}
                {pet.size_preference?.map((s: string) => (
                  <Badge key={s} variant="outline" className="text-[10px]">{s} size</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={() => handleAction("pass")}
          className="w-16 h-16 rounded-full border-2 border-destructive/30 bg-card flex items-center justify-center shadow-lg hover:bg-destructive/10 hover:scale-110 transition-all"
        >
          <X className="w-8 h-8 text-destructive" />
        </button>
        <button
          onClick={() => handleAction("like")}
          className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-110 transition-all"
        >
          <Heart className="w-10 h-10" fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default PetSwipeCards;
