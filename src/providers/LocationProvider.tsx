import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

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
  const { t } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem("location_permission");
    if (stored === "granted") {
      requestLocation();
    } else if (stored === "denied" || stored === "deferred") {
      // User previously skipped — don't show prompt again
    } else {
      // First time — defer prompt so the page content renders first and the modal
      // never makes the app look "stuck" on initial load.
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
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

  const getDistance = useCallback((targetLat: number | null, targetLng: number | null): string | null => {
    if (!granted || lat === null || lng === null || targetLat === null || targetLng === null) return null;
    const km = haversine(lat, lng, targetLat, targetLng);
    if (km < 1) return t("location.meters_away", `${Math.round(km * 1000)} m away`).replace("{n}", String(Math.round(km * 1000)));
    return t("location.km_away", `${km.toFixed(1)} km away`).replace("{n}", km.toFixed(1));
  }, [granted, lat, lng, t]);

  const value = useMemo(() => ({ lat, lng, granted, getDistance }), [lat, lng, granted, getDistance]);

  return (
    <LocationContext.Provider value={value}>
      {showPrompt && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] sm:max-w-sm">
          <div className="bg-white rounded-2xl p-4 shadow-xl border" style={{ borderColor: "#E2EBFC", animation: "slideUp 0.3s ease-out" }}>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0" style={{ background: "#E0F2FE" }}>
                <MapPin className="w-5 h-5" style={{ color: "#1E3A5F" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="mb-1" style={{ fontSize: 14, fontWeight: 600, color: "#1E3A5F" }}>
                  {t("location.permission_title", "Location Permission")}
                </h3>
                <p className="mb-3" style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
                  {t("location.permission_desc", "Allow location access to see what's nearby.")}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleSkip} style={{ fontSize: 12 }}>
                    {t("common.skip", "Skip")}
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleAllow} style={{ background: "#1E3A5F", color: "#fff", fontSize: 12 }}>
                    {t("location.allow", "Allow")}
                  </Button>
                </div>
              </div>
              <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground flex-shrink-0" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </LocationContext.Provider>
  );
}
