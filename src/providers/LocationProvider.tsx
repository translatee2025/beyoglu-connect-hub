import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

interface LocationContextValue {
  lat: number | null;
  lng: number | null;
  granted: boolean;
  getDistance: (targetLat: number | null, targetLng: number | null) => string | null;
}

const LocationContext = createContext<LocationContextValue>({
  lat: null, lng: null, granted: false, getDistance: () => null,
});

export const useLocation = () => useContext(LocationContext);

// Haversine formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [granted, setGranted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("location_permission");
    if (stored === "granted") {
      requestLocation();
    } else if (stored === "denied") {
      // User previously skipped — don't show prompt again
    } else {
      // First time — show prompt
      setShowPrompt(true);
    }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGranted(true);
        localStorage.setItem("location_permission", "granted");
        setShowPrompt(false);
      },
      () => {
        localStorage.setItem("location_permission", "denied");
        setShowPrompt(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const handleAllow = () => requestLocation();
  const handleSkip = () => {
    localStorage.setItem("location_permission", "denied");
    setShowPrompt(false);
  };

  const getDistance = (targetLat: number | null, targetLng: number | null): string | null => {
    if (!granted || lat === null || lng === null || targetLat === null || targetLng === null) return null;
    const km = haversine(lat, lng, targetLat, targetLng);
    if (km < 1) return `${Math.round(km * 1000)} m uzakta`;
    return `${km.toFixed(1)} km uzakta`;
  };

  return (
    <LocationContext.Provider value={{ lat, lng, granted, getDistance }}>
      {showPrompt && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm mx-4 mb-0 sm:mb-0 shadow-xl" style={{ animation: "slideUp 0.3s ease-out" }}>
            <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4" style={{ background: "#E0F2FE" }}>
              <MapPin className="w-6 h-6" style={{ color: "#1E3A5F" }} />
            </div>
            <h3 className="text-center mb-2" style={{ fontSize: 15, fontWeight: 600, color: "#1E3A5F" }}>
              Konum İzni
            </h3>
            <p className="text-center mb-5" style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
              Yakınındakileri görmek için konumuna erişmemize izin ver.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleSkip} style={{ fontSize: 13 }}>
                Geç
              </Button>
              <Button className="flex-1" onClick={handleAllow} style={{ background: "#1E3A5F", color: "#fff", fontSize: 13 }}>
                İzin Ver
              </Button>
            </div>
          </div>
        </div>
      )}
      {children}
    </LocationContext.Provider>
  );
}
