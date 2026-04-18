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

interface Event {
  id?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  coordinates: [number, number];
  category: string;
  cover_photo?: string | null;
}

interface EventsMapProps {
  events: Event[];
}

const EventsMap = ({ events }: EventsMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [41.0330, 28.9815],
      zoom: 14,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    events.forEach((event) => {
      const photoHtml = event.cover_photo
        ? `<img src="${event.cover_photo}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin-right:8px;float:left;" />`
        : "";
      const detailLink = event.id ? `<a href="/events/${event.id}" style="color:#1E3A5F;font-size:11px;font-weight:500;text-decoration:none;">Details →</a>` : "";

      L.marker(event.coordinates, { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding:4px;min-width:180px;overflow:hidden;">
            ${photoHtml}
            <div>
              <h3 style="font-weight:600;font-size:13px;margin:0 0 4px;color:#1E3A5F;">${event.title}</h3>
              <p style="font-size:11px;color:#64748B;margin:0 0 2px;">📅 ${event.date}</p>
              ${event.location ? `<p style="font-size:11px;color:#94A3B8;margin:0 0 4px;">📍 ${event.location}</p>` : ""}
              ${detailLink}
            </div>
          </div>
        `, { maxWidth: 280 });
    });
  }, [events]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ border: "1px solid #E2EBFC", height: "min(500px, 55vh)" }}
    />
  );
};

export default EventsMap;
