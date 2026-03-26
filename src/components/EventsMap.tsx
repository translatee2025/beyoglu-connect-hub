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
  title: string;
  date: string;
  time: string;
  location: string;
  coordinates: [number, number];
  category: string;
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
      center: [41.0346, 28.9784],
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
      L.marker(event.coordinates, { icon: markerIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding: 4px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px;">${event.title}</h3>
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 2px;">${event.location}</p>
            <p style="font-size: 12px; margin: 0;">${event.date} at ${event.time}</p>
          </div>
        `);
    });
  }, [events]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-border"
    />
  );
};

export default EventsMap;
