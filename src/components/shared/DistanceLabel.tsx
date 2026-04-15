import { MapPin } from "lucide-react";
import { useLocation } from "@/providers/LocationProvider";

interface DistanceLabelProps {
  lat: number | null;
  lng: number | null;
  neighborhood?: string | null;
}

export function DistanceLabel({ lat, lng, neighborhood }: DistanceLabelProps) {
  const { getDistance, granted } = useLocation();
  const distance = getDistance(lat, lng);

  if (distance) {
    return (
      <span className="flex items-center gap-0.5" style={{ fontSize: 11, color: "#94A3B8" }}>
        <MapPin className="w-3 h-3" /> {distance}
      </span>
    );
  }

  if (neighborhood) {
    return (
      <span className="flex items-center gap-0.5" style={{ fontSize: 11, color: "#94A3B8" }}>
        <MapPin className="w-3 h-3" /> {neighborhood}
      </span>
    );
  }

  return null;
}
