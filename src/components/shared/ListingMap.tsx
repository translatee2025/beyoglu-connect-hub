import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface ListingPin {
  lat: number;
  lng: number;
  title: string;
  badge?: string;
  extra?: string;
}

interface ListingMapProps {
  items: ListingPin[];
  height?: string;
}

const ListingMap = ({ items, height = "400px" }: ListingMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [41.037, 28.985],
      zoom: 14,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer); });
    const validItems = items.filter((i) => i.lat && i.lng);
    validItems.forEach((item) => {
      L.marker([item.lat, item.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding:4px">
            <h3 style="font-weight:600;font-size:14px;margin:0 0 4px">${item.title}</h3>
            ${item.badge ? `<span style="font-size:11px;background:#e5e7eb;padding:2px 6px;border-radius:4px">${item.badge}</span>` : ""}
            ${item.extra ? `<p style="font-size:12px;color:#6b7280;margin:4px 0 0">${item.extra}</p>` : ""}
          </div>
        `);
    });
    if (validItems.length > 0) {
      const bounds = L.latLngBounds(validItems.map((i) => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [items]);

  return <div ref={mapRef} className="w-full rounded-lg overflow-hidden border border-border" style={{ height: `min(${height}, 55vh)` }} />;
};

export default ListingMap;
