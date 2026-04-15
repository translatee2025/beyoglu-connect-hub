import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Users, ArrowLeft, Trash2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRef } from "react";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) +
    ", " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
};

function EventMap({ lat, lng }: { lat: number; lng: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { center: [lat, lng], zoom: 15, scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    L.marker([lat, lng], { icon: markerIcon }).addTo(map);
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-64 rounded-lg overflow-hidden border border-border" />;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: attendeeCount = 0 } = useQuery({
    queryKey: ["event-attendee-count", id],
    queryFn: async () => {
      const { count } = await supabase.from("event_attendees").select("*", { count: "exact", head: true }).eq("event_id", id!);
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: isAttending = false } = useQuery({
    queryKey: ["event-attending", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("event_attendees").select("id").eq("event_id", id!).eq("user_id", user!.id).maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ["event-attendees", id],
    queryFn: async () => {
      const { data } = await supabase.from("event_attendees").select("user_id").eq("event_id", id!).limit(10);
      if (!data?.length) return [];
      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      return profiles || [];
    },
    enabled: !!id,
  });

  const toggleRsvp = useMutation({
    mutationFn: async () => {
      if (!user) { navigate("/auth"); return; }
      if (isAttending) {
        await supabase.from("event_attendees").delete().eq("event_id", id!).eq("user_id", user.id);
      } else {
        await supabase.from("event_attendees").insert({ event_id: id!, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attending", id] });
      queryClient.invalidateQueries({ queryKey: ["event-attendee-count", id] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async () => {
      await supabase.from("events").update({ status: "deleted" }).eq("id", id!);
    },
    onSuccess: () => {
      toast({ title: t("events.deleted", "Etkinlik silindi") });
      navigate("/events");
    },
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">{t("events.not_found", "Etkinlik bulunamadı")}</p>
    </div>
  );

  const isOwner = user?.id === event.user_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/events")}>
            <ArrowLeft className="w-4 h-4" /> {t("common.back", "Geri")}
          </Button>

          {event.cover_photo && (
            <img src={event.cover_photo} alt={event.title} className="w-full h-64 object-cover rounded-xl mb-6" />
          )}

          <div className="flex items-start justify-between mb-4">
            <div>
              {event.category && <Badge variant="secondary" className="mb-2">{event.category}</Badge>}
              <h1 className="font-display font-bold text-3xl text-foreground">{event.title}</h1>
            </div>
            {event.is_free ? (
              <Badge className="bg-green-100 text-green-800">{t("events.free", "Ücretsiz")}</Badge>
            ) : (
              <Badge variant="outline">{event.price} {event.currency || "TRY"}</Badge>
            )}
          </div>

          <Card className="p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="w-5 h-5 text-primary" />
              <span>{formatEventDate(event.start_at)}</span>
            </div>
            {event.end_at && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>{t("events.until", "Bitiş:")} {formatEventDate(event.end_at)}</span>
              </div>
            )}
            {(event.venue_name || event.address) && (
              <div className="flex items-center gap-3 text-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{event.venue_name}{event.address ? `, ${event.address}` : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              <span>{attendeeCount} {t("events.attending", "katılımcı")}</span>
            </div>
          </Card>

          {event.description && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-2">{t("events.about", "Hakkında")}</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => { if (!user) { navigate("/auth"); return; } toggleRsvp.mutate(); }}
              variant={isAttending ? "outline" : "default"}
              className="flex-1 gap-2"
              disabled={toggleRsvp.isPending}
            >
              {isAttending ? <><Check className="w-4 h-4" /> {t("events.attending_btn", "Katılıyorum")}</> : t("events.rsvp", "Katıl")}
            </Button>
            {isOwner && (
              <Button variant="destructive" size="icon" onClick={() => deleteEvent.mutate()} disabled={deleteEvent.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {attendees.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-3">{t("events.attendees", "Katılımcılar")}</h2>
              <div className="flex flex-wrap gap-3">
                {attendees.map((a) => (
                  <div key={a.user_id} className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1">
                    <Avatar className="w-7 h-7">
                      {a.avatar_url && <AvatarImage src={a.avatar_url} />}
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {(a.display_name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{a.display_name || "User"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.lat && event.lng && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-3">{t("events.location", "Konum")}</h2>
              <EventMap lat={Number(event.lat)} lng={Number(event.lng)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
