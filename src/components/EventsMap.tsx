import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { icon as leafletIcon } from "leaflet";

// Vite + Leaflet: create an explicit marker icon (avoids default-export pitfalls)
const markerIcon = leafletIcon({
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
  const beyogluCenter: [number, number] = [41.0346, 28.9784];

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-border">
      <MapContainer
        center={beyogluCenter}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {events.map((event, index) => (
          <Marker key={index} position={event.coordinates} icon={markerIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                <p className="text-xs text-muted-foreground mb-1">{event.location}</p>
                <p className="text-xs">
                  {event.date} at {event.time}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default EventsMap;
