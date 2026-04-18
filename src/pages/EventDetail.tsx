import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Check, Flag, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { UserName } from "@/components/shared/UserName";
import { MediaGrid } from "@/components/shared/MediaGrid";
import { ReportDialog } from "@/components/shared/ReportDialog";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const CATEGORY_PLACEHOLDERS: Record<string, { bg: string; emoji: string }> = {
  sports: { bg: "#DCFCE7", emoji: "⚽" },
  culture: { bg: "#EDE9FE", emoji: "🎨" },
  art: { bg: "#EDE9FE", emoji: "🎨" },
  music: { bg: "#FEF3C7", emoji: "🎵" },
  community: { bg: "#E0F2FE", emoji: "👥" },
  food: { bg: "#FEF3C7", emoji: "🍽️" },
};

const getPlaceholder = (category?: string | null) => {
  if (!category) return { bg: "#EFF4FF", emoji: "📅" };
  return CATEGORY_PLACEHOLDERS[category.toLowerCase()] || { bg: "#EFF4FF", emoji: "📅" };
};

// formatEventDate moved inside component

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

  return <div ref={mapRef} className="w-full h-52 rounded-lg overflow-hidden" style={{ border: "1px solid #E2EBFC" }} />;
}

const EventDetail = () => {
  const [reportOpen, setReportOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) +
      " · " + d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };
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

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-[#94A3B8] text-sm">Yükleniyor...</div>;
  if (!event) return <div className="min-h-screen bg-background flex items-center justify-center text-[#94A3B8] text-sm">Etkinlik bulunamadı</div>;

  const isOwner = user?.id === event.user_id;
  const ph = getPlaceholder(event.category);

  return (
    <div className="min-h-screen bg-background">
      {/* Cover photo */}
      <div className="relative w-full h-[280px] overflow-hidden">
        {event.cover_photo ? (
          <img src={event.cover_photo} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: ph.bg }}>
            <span className="text-[48px]">{ph.emoji}</span>
          </div>
        )}
        <button
          onClick={() => navigate("/events")}
          className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        {user && !isOwner && (
          <button
            onClick={() => setReportOpen(true)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <Flag className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <div className="container mx-auto px-4 max-w-3xl" style={{ marginTop: "-20px", position: "relative", zIndex: 10 }}>
        <div className="bg-card rounded-xl p-4" style={{ border: "1px solid #E2EBFC" }}>
          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-[22px] font-bold" style={{ color: "#1E3A5F" }}>{event.title}</h1>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {event.category && <Badge variant="outline" className="text-[10px]">{t(`event_cat.${event.category.toLowerCase()}`, event.category)}</Badge>}
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={event.is_free
                  ? { backgroundColor: "#DCFCE7", color: "#166534" }
                  : { backgroundColor: "#FEF3C7", color: "#92400E" }}
              >
                {event.is_free ? t("events.free", "Free") : `${event.price || 0} TRY`}
              </span>
            </div>
          </div>

          {/* Date & location */}
          <div className="space-y-1.5 mb-3">
            <p className="text-[12px] flex items-center gap-1.5" style={{ color: "#374151" }}>
              📅 {formatEventDate(event.start_at)}
            </p>
            {event.end_at && (
              <p className="text-[12px] flex items-center gap-1.5" style={{ color: "#94A3B8" }}>
                🕐 {t("events.ends", "Ends:")} {formatEventDate(event.end_at)}
              </p>
            )}
            {(event.venue_name || event.address) && (
              <p className="text-[12px] flex items-center gap-1.5" style={{ color: "#64748B" }}>
                📍 {event.venue_name}{event.address ? `, ${event.address}` : ""}
              </p>
            )}
            <p className="text-[12px] flex items-center gap-1.5" style={{ color: "#64748B" }}>
              👥 {attendeeCount} {t("events.attendees", "attendees")}
            </p>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-[13px] mb-3" style={{ color: "#374151", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{event.description}</p>
          )}

          {/* Photos */}
          {event.photos && (event.photos as string[]).length > 0 && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <MediaGrid urls={event.photos as string[]} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
            <button
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
              style={
                isAttending
                  ? { border: "1px solid #1E3A5F", color: "#1E3A5F", backgroundColor: "white" }
                  : event.is_free
                    ? { border: "1px solid #1E3A5F", color: "#1E3A5F", backgroundColor: "white" }
                    : { backgroundColor: "#E74C3C", color: "white", border: "none" }
              }
              onClick={() => { if (!user) { navigate("/auth"); return; } toggleRsvp.mutate(); }}
            >
              {isAttending ? t("events.attending", "✓ Attending") : event.is_free ? t("events.join", "Join") : t("events.buy_ticket", "Buy Ticket")}
            </button>
            <button
              className="py-2 px-4 rounded-lg text-xs font-medium"
              style={{ border: "1px solid #1E3A5F", color: "#1E3A5F" }}
              onClick={() => navigator.share?.({ url: window.location.href, title: event.title }).catch(() => {})}
            >
              <Share2 className="w-3.5 h-3.5 inline mr-1" />{t("common.share", "Share")}
            </button>
            {isOwner && (
              <button
                className="py-2 px-3 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: "#DC2626" }}
                onClick={() => deleteEvent.mutate()}
              >
                <Trash2 className="w-3.5 h-3.5 inline" />
              </button>
            )}
          </div>

          {/* Creator info */}
          {event.user_id && (
            <div className="flex items-center gap-1.5 text-[11px] pt-2" style={{ borderTop: "1px solid #E2EBFC", color: "#94A3B8" }}>
              <UserName userId={event.user_id} showAvatar avatarSize="w-5 h-5" className="text-[11px]" />
              <span>{t("events.created_by", "created by")}</span>
            </div>
          )}
        </div>

        {/* Attendees */}
        {attendees.length > 0 && (
          <div className="mt-3 bg-card rounded-xl p-4" style={{ border: "1px solid #E2EBFC" }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: "#1E3A5F" }}>
              {t("events.attendees", "attendees")} ({attendeeCount})
            </h2>
            <div className="flex flex-wrap gap-2">
              {attendees.map((a: any) => (
                <div key={a.user_id} className="flex items-center gap-1.5 rounded-full px-2 py-1" style={{ backgroundColor: "#EFF4FF" }}>
                  <UserName userId={a.user_id} showAvatar avatarSize="w-5 h-5" className="text-[11px]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {event.lat && event.lng && (
          <div className="mt-3 mb-6 bg-card rounded-xl p-4" style={{ border: "1px solid #E2EBFC" }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: "#1E3A5F" }}>{t("events.location", "Location")}</h2>
            <EventMap lat={Number(event.lat)} lng={Number(event.lng)} />
          </div>
        )}
      </div>

      {id && (
        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} contentType="event" contentId={id} />
      )}
    </div>
  );
};

export default EventDetail;
