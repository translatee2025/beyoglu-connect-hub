import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Heart, Star, TrendingUp, MapPin } from "lucide-react";
import { LikeButton } from "@/components/social/LikeButton";

interface RankedVenue { id: string; name: string; cover_photo: string | null; neighborhood: string | null; rating_avg: number | null; review_count: number | null; venue_type_name: string; like_count: number; }

const VenueCharts = () => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<string>("all");

  const { data: venueTypes = [] } = useQuery({
    queryKey: ["venue-types-chart"],
    queryFn: async () => { const { data } = await supabase.from("venue_types").select("id, name").eq("is_active", true).order("sort_order"); return data || []; },
  });

  const { data: rankedVenues = [], isLoading } = useQuery({
    queryKey: ["venue-charts", filterType],
    queryFn: async () => {
      const { data: likes } = await supabase.from("likes").select("entity_id").eq("entity_type", "venue");
      const likeCounts: Record<string, number> = {};
      (likes || []).forEach((l) => { likeCounts[l.entity_id] = (likeCounts[l.entity_id] || 0) + 1; });
      const { data: venues } = await supabase.from("venues").select("id, name, cover_photo, neighborhood, rating_avg, review_count, venue_type_id").eq("status", "active");
      const typeMap: Record<string, string> = {};
      venueTypes.forEach((vt) => { typeMap[vt.id] = vt.name; });
      return (venues || []).filter((v) => filterType === "all" || v.venue_type_id === filterType).map((v) => ({ ...v, venue_type_name: typeMap[v.venue_type_id] || "Other", like_count: likeCounts[v.id] || 0 })).sort((a, b) => b.like_count - a.like_count) as RankedVenue[];
    },
    enabled: venueTypes.length > 0,
  });

  const top3 = rankedVenues.slice(0, 3);
  const rest = rankedVenues.slice(3);
  const medalColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-7 h-7 text-primary" />
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">{t("charts.title", "Venue Charts")}</h1>
              <p className="text-sm text-muted-foreground">{t("charts.subtitle", "Most loved places in the neighborhood")}</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            <Button size="sm" variant={filterType === "all" ? "default" : "outline"} onClick={() => setFilterType("all")} className="flex-shrink-0">{t("charts.all", "All")}</Button>
            {venueTypes.map((vt) => <Button key={vt.id} size="sm" variant={filterType === vt.id ? "default" : "outline"} onClick={() => setFilterType(vt.id)} className="flex-shrink-0">{vt.name}</Button>)}
          </div>
          {isLoading ? <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          : rankedVenues.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t("charts.empty", "No venues ranked yet. Be the first to like a venue!")}</p></div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {top3.map((venue, i) => (
                  <Card key={venue.id} className={`overflow-hidden ${i === 0 ? "border-yellow-500/30 bg-yellow-500/5" : ""}`}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center"><Trophy className={`w-6 h-6 ${medalColors[i]}`} /></div>
                      {venue.cover_photo ? <img src={venue.cover_photo} alt={venue.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Star className="w-6 h-6 text-muted-foreground" /></div>}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{venue.name}</h3>
                        <div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-xs">{venue.venue_type_name}</Badge>{venue.neighborhood && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {venue.neighborhood}</span>}</div>
                        {venue.rating_avg != null && venue.rating_avg > 0 && <div className="flex items-center gap-1 mt-1"><Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /><span className="text-xs text-foreground">{venue.rating_avg.toFixed(1)}</span><span className="text-xs text-muted-foreground">({venue.review_count})</span></div>}
                      </div>
                      <div className="flex flex-col items-center flex-shrink-0"><LikeButton entityType="venue" entityId={venue.id} /><span className="text-xs font-medium text-muted-foreground mt-0.5">{venue.like_count}</span></div>
                    </div>
                  </Card>
                ))}
              </div>
              {rest.length > 0 && (
                <div className="space-y-1">
                  <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{t("charts.more", "More Venues")}</h2>
                  {rest.map((venue, i) => (
                    <div key={venue.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 4}</span>
                      {venue.cover_photo ? <img src={venue.cover_photo} alt={venue.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><Star className="w-4 h-4 text-muted-foreground" /></div>}
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{venue.name}</p><p className="text-xs text-muted-foreground">{venue.venue_type_name}</p></div>
                      <div className="flex items-center gap-1 flex-shrink-0"><Heart className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{venue.like_count}</span></div>
                      <LikeButton entityType="venue" entityId={venue.id} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueCharts;
