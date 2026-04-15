import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Users, Map as MapIcon, Plus, Check } from "lucide-react";
import EventsMap from "@/components/EventsMap";
import CreateEventForm from "@/components/events/CreateEventForm";

const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) +
    ", " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
};

const Events = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
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
      if (!user) { navigate("/auth"); return; }
      if (myRsvps.has(eventId)) {
        await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);
      } else {
        await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["event-attendee-counts"] });
    },
  });

  // Map data format
  const mapEvents = events
    .filter(e => e.lat && e.lng)
    .map(e => ({
      title: e.title,
      date: formatEventDate(e.start_at),
      time: "",
      location: e.venue_name || e.address || "",
      coordinates: [Number(e.lat), Number(e.lng)] as [number, number],
      category: e.category || "",
    }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              {t("events.title", "Etkinlikler")}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("events.subtitle", "Mahallenizdeki etkinlikleri keşfedin ve katılın")}
            </p>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div />
            {user && (
              <Button variant="hero" className="gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> {t("events.create", "Etkinlik Oluştur")}
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />{t("events.list_view", "Liste")}
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="w-4 h-4" />{t("events.map_view", "Harita")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">{t("events.no_events", "Yaklaşan etkinlik bulunamadı")}</p>
                  {user && (
                    <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
                      {t("events.create_first", "İlk etkinliği oluşturun")}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/events/${event.id}`)}>
                      {event.cover_photo && (
                        <img src={event.cover_photo} alt={event.title} className="w-full h-40 object-cover" />
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {event.category && <Badge variant="secondary">{event.category}</Badge>}
                              {event.is_free ? (
                                <Badge variant="secondary">{t("events.free", "Ücretsiz")}</Badge>
                              ) : (
                                <Badge variant="outline">{event.price} TRY</Badge>
                              )}
                            </div>
                            <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                            <CardDescription className="space-y-1">
                              <div className="flex items-center gap-2 text-foreground">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{formatEventDate(event.start_at)}</span>
                              </div>
                              {(event.venue_name || event.address) && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{event.venue_name || event.address}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <span>{attendeeCounts[event.id] || 0} {t("events.attending", "katılımcı")}</span>
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant={myRsvps.has(event.id) ? "outline" : "default"}
                          className="w-full gap-2"
                          onClick={(e) => { e.stopPropagation(); toggleRsvp.mutate(event.id); }}
                          disabled={toggleRsvp.isPending}
                        >
                          {myRsvps.has(event.id) ? (
                            <><Check className="w-4 h-4" /> {t("events.attending_btn", "Katılıyorum")}</>
                          ) : (
                            t("events.rsvp", "Katıl")
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="map">
              {activeTab === "map" && <EventsMap events={mapEvents} />}
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {t("events.click_markers", "Detaylar için işaretçilere tıklayın")}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CreateEventForm open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default Events;
