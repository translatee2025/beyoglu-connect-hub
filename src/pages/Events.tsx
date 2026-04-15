import { useState } from "react";
import { UserName } from "@/components/shared/UserName";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin as MapPinIcon, Plus, Check, List, Map as MapIcon } from "lucide-react";
import EventsMap from "@/components/EventsMap";
import CreateEventForm from "@/components/events/CreateEventForm";
import { createNotification, getDisplayName } from "@/lib/notifications";

const CATEGORY_PLACEHOLDERS: Record<string, { bg: string; emoji: string }> = {
  sports: { bg: "#DCFCE7", emoji: "⚽" },
  culture: { bg: "#EDE9FE", emoji: "🎨" },
  art: { bg: "#EDE9FE", emoji: "🎨" },
  music: { bg: "#FEF3C7", emoji: "🎵" },
  community: { bg: "#E0F2FE", emoji: "👥" },
  networking: { bg: "#E0F2FE", emoji: "🤝" },
  food: { bg: "#FEF3C7", emoji: "🍽️" },
  other: { bg: "#EFF4FF", emoji: "📅" },
};

const getPlaceholder = (category?: string | null) => {
  if (!category) return { bg: "#EFF4FF", emoji: "📅" };
  const key = category.toLowerCase();
  return CATEGORY_PLACEHOLDERS[key] || { bg: "#EFF4FF", emoji: "📅" };
};

const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) +
    " · " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
};

const Events = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: attendeeCounts = {} } = useQuery({
    queryKey: ["event-attendee-counts", events.map(e => e.id)],
    queryFn: async () => {
      if (!events.length) return {};
      const counts: Record<string, number> = {};
      const { data } = await supabase
        .from("event_attendees")
        .select("event_id")
        .in("event_id", events.map(e => e.id));
      (data || []).forEach(row => {
        counts[row.event_id] = (counts[row.event_id] || 0) + 1;
      });
      return counts;
    },
    enabled: events.length > 0,
  });

  const { data: myRsvps = new Set<string>() } = useQuery({
    queryKey: ["my-rsvps", user?.id, events.map(e => e.id)],
    queryFn: async () => {
      if (!events.length || !user) return new Set<string>();
      const { data } = await supabase
        .from("event_attendees")
        .select("event_id")
        .eq("user_id", user.id)
        .in("event_id", events.map(e => e.id));
      return new Set((data || []).map(r => r.event_id));
    },
    enabled: events.length > 0 && !!user,
  });

  const toggleRsvp = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) { navigate("/auth"); return "none"; }
      if (myRsvps.has(eventId)) {
        await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);
        return "removed";
      } else {
        await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id });
        return eventId;
      }
    },
    onSuccess: async (eventId) => {
      queryClient.invalidateQueries({ queryKey: ["my-rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["event-attendee-counts"] });
      if (eventId && eventId !== "removed" && eventId !== "none" && user) {
        try {
          const event = events.find(e => e.id === eventId);
          if (event && event.user_id !== user.id) {
            const displayName = await getDisplayName(user.id);
            await createNotification({
              userId: event.user_id,
              type: "event_rsvp",
              body: `${displayName} is attending your event`,
              link: `/events/${eventId}`,
            });
          }
        } catch {}
      }
    },
  });

  // Apply client-side filters
  const filteredEvents = events.filter((e) => {
    if (freeOnly && !e.is_free) return false;
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (new Date(e.start_at) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      if (new Date(e.start_at) > to) return false;
    }
    return true;
  });

  const mapEvents = filteredEvents
    .filter(e => e.lat && e.lng)
    .map(e => ({
      id: e.id,
      title: e.title,
      date: formatEventDate(e.start_at),
      time: "",
      location: e.venue_name || e.address || "",
      coordinates: [Number(e.lat), Number(e.lng)] as [number, number],
      category: e.category || "",
      cover_photo: e.cover_photo,
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-app mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-[15px] font-semibold text-foreground">{t("events.title", "Etkinlikler")}</h1>
            <div className="flex items-center gap-2">
              {user && (
                <Button size="sm" variant="cta" className="gap-1 text-xs" onClick={() => setShowCreate(true)}>
                  <Plus className="w-3.5 h-3.5" /> {t("events.create", "Oluştur")}
                </Button>
              )}
            </div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1.5 mb-3">
            <Button variant={activeTab === "list" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("list")} className="gap-1 text-xs">
              <List className="w-3.5 h-3.5" /> Liste
            </Button>
            <Button variant={activeTab === "map" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("map")} className="gap-1 text-xs">
              <MapIcon className="w-3.5 h-3.5" /> Harita
            </Button>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: "#64748B" }}>Başlangıç</span>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-xs h-8 w-[130px]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: "#64748B" }}>Bitiş</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-xs h-8 w-[130px]" />
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-[11px] underline" style={{ color: "#E74C3C" }}>Temizle</button>
            )}
            {/* Free toggle */}
            <button
              onClick={() => setFreeOnly(!freeOnly)}
              className="flex-shrink-0 text-[11px] transition-all"
              style={{
                padding: "5px 14px",
                borderRadius: "20px",
                border: "1px solid #E74C3C",
                ...(freeOnly
                  ? { backgroundColor: "#E74C3C", color: "white" }
                  : { backgroundColor: "white", color: "#E74C3C" }),
              }}
            >
              {freeOnly && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5" style={{ verticalAlign: "middle" }} />}
              Sadece Ücretsiz
            </button>
          </div>

          {activeTab === "list" ? (
            isLoading ? (
              <SkeletonGrid count={3} hasPhoto photoHeight={160} />
            ) : filteredEvents.length === 0 ? (
              <EmptyState emoji="📅" message={t("empty.events", "Yakında etkinlik yok. Bir etkinlik oluştur!")} actionLabel={t("events.create_event", "Etkinlik Oluştur")} onAction={() => setShowCreate(true)} />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredEvents.map((event) => {
                  const ph = getPlaceholder(event.category);
                  const isRsvped = myRsvps.has(event.id);
                  return (
                    <div
                      key={event.id}
                      className="bg-card rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                      style={{ border: "1px solid #E2EBFC" }}
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      {/* Cover photo */}
                      <div className="h-[160px] relative overflow-hidden" style={{ borderRadius: "12px 12px 0 0" }}>
                        {event.cover_photo ? (
                          <img src={event.cover_photo} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: ph.bg }}>
                            <span className="text-[32px]">{ph.emoji}</span>
                          </div>
                        )}
                        {/* Category badge */}
                        {event.category && (
                          <span className="absolute top-0 left-0 text-[10px] font-medium text-white" style={{ backgroundColor: "#1E3A5F", padding: "3px 8px", borderRadius: "0 0 6px 0" }}>
                            {event.category}
                          </span>
                        )}
                        {/* Free/Price badge */}
                        <span
                          className="absolute top-0 right-0 text-[10px] font-medium"
                          style={{
                            padding: "3px 8px",
                            borderRadius: "0 0 0 6px",
                            ...(event.is_free
                              ? { backgroundColor: "#DCFCE7", color: "#166534" }
                              : { backgroundColor: "#FEF3C7", color: "#92400E" }),
                          }}
                        >
                          {event.is_free ? "Ücretsiz" : `${event.price || 0} TRY`}
                        </span>
                      </div>
                      {/* Card body */}
                      <div className="p-3">
                        <h3 className="text-[14px] font-semibold mb-1" style={{ color: "#1E3A5F" }}>{event.title}</h3>
                        <p className="text-[11px] flex items-center gap-1 mb-0.5" style={{ color: "#64748B" }}>
                          📅 {formatEventDate(event.start_at)}
                        </p>
                        {(event.venue_name || event.address) && (
                          <p className="text-[11px] flex items-center gap-1 truncate mb-1" style={{ color: "#94A3B8" }}>
                            📍 {event.venue_name || event.address}
                          </p>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          {event.user_id && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <UserName userId={event.user_id} showAvatar avatarSize="w-4 h-4" className="text-[11px]" />
                            </div>
                          )}
                          <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                            👥 {attendeeCounts[event.id] || 0}
                          </span>
                        </div>
                        {/* RSVP button */}
                        <button
                          className="w-full py-1.5 rounded-md text-xs font-medium transition-colors"
                          style={
                            isRsvped
                              ? { border: "1px solid #1E3A5F", color: "#1E3A5F", backgroundColor: "white" }
                              : event.is_free
                                ? { border: "1px solid #1E3A5F", color: "#1E3A5F", backgroundColor: "white" }
                                : { backgroundColor: "#E74C3C", color: "white", border: "none" }
                          }
                          onClick={(e) => { e.stopPropagation(); toggleRsvp.mutate(event.id); }}
                        >
                          {isRsvped ? "✓ Katılıyorum" : event.is_free ? "Katıl" : "Bilet Al"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div>
              {activeTab === "map" && <EventsMap events={mapEvents} />}
            </div>
          )}
        </div>
      </div>

      <CreateEventForm open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default Events;
