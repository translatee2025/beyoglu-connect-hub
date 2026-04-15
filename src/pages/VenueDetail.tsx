import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, MapPin, Phone, Clock, Star, ArrowLeft, Globe, MessageSquare } from "lucide-react";
import { LikeButton } from "@/components/social/LikeButton";
import { CommentsSection } from "@/components/shared/CommentsSection";
import { UserName } from "@/components/shared/UserName";
import { MediaGrid } from "@/components/shared/MediaGrid";

const VenueDetail = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue-detail", venueId],
    queryFn: async () => {
      const { data } = await supabase
        .from("venues")
        .select("*, venue_types(name, icon)")
        .eq("id", venueId!)
        .single();
      return data;
    },
    enabled: !!venueId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["venue-reviews", venueId],
    queryFn: async () => {
      const { data } = await supabase
        .from("venue_reviews")
        .select("*")
        .eq("venue_id", venueId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!venueId,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["venue-menu", venueId],
    queryFn: async () => {
      const { data } = await supabase
        .from("venue_menu_items")
        .select("*")
        .eq("venue_id", venueId!)
        .eq("is_available", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!venueId,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["venue-deals", venueId],
    queryFn: async () => {
      const { data } = await supabase
        .from("venue_deals")
        .select("*")
        .eq("venue_id", venueId!)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!venueId,
  });

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground">Loading...</div>;
  if (!venue) return <div className="flex justify-center py-20 text-muted-foreground">Venue not found</div>;

  const hours = venue.hours as Record<string, { open: string; close: string }> | null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {/* Header */}
        <Card className="mb-4">
          <CardHeader>
            {venue.cover_photo && (
              <img src={venue.cover_photo} alt={venue.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            )}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Store className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{venue.name}</CardTitle>
                {(venue as any).venue_types?.name && <Badge variant="outline" className="mb-2">{(venue as any).venue_types.name}</Badge>}
                {venue.is_verified && <Badge className="ml-2 bg-green-600">Verified</Badge>}
                {venue.description && <p className="text-muted-foreground text-sm mt-2">{venue.description}</p>}

                <div className="flex items-center gap-4 mt-3">
                  {venue.rating_avg !== null && venue.rating_avg! > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{Number(venue.rating_avg).toFixed(1)}</span>
                      <span className="text-muted-foreground">({venue.review_count})</span>
                    </div>
                  )}
                  <LikeButton entityType="venue" entityId={venue.id} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {venue.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /> {venue.address}</div>}
            {venue.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /> {venue.phone}</div>}
            {venue.website && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="w-4 h-4" /> <a href={venue.website} target="_blank" className="underline">{venue.website}</a></div>}
            {venue.created_by_user_id && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-muted-foreground text-xs">Added by</span>
                <UserName userId={venue.created_by_user_id} showAvatar />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        {venue.photos && (venue.photos as string[]).length > 0 && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <MediaGrid urls={venue.photos as string[]} />
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reviews yet</p>
            ) : reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserName userId={review.user_id} showAvatar />
                    <div className="flex items-center gap-0.5 ml-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  {review.body && <p className="text-sm text-foreground">{review.body}</p>}
                  {review.reply_body && (
                    <div className="mt-2 pl-3 border-l-2 border-primary/30">
                      <p className="text-xs text-muted-foreground font-medium">Owner reply:</p>
                      <p className="text-sm text-foreground">{review.reply_body}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <CommentsSection entityType="venue" entityId={venue.id} />
          </TabsContent>

          <TabsContent value="menu">
            {menuItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No menu items yet</p>
            ) : (
              <div className="space-y-2">
                {menuItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="py-3 px-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{item.item_name}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                      {item.price && <span className="font-semibold text-primary">{item.currency || "₺"}{item.price}</span>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deals">
            {deals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active deals</p>
            ) : deals.map((deal: any) => (
              <Card key={deal.id} className="border-primary/30">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary">{deal.discount_label || "Deal"}</Badge>
                    <span className="font-semibold text-foreground">{deal.title}</span>
                  </div>
                  {deal.description && <p className="text-sm text-muted-foreground">{deal.description}</p>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="hours">
            {!hours || Object.keys(hours).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Hours not set</p>
            ) : (
              <Card>
                <CardContent className="py-3 px-4 space-y-2">
                  {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
                    const h = hours[day];
                    return (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="font-medium capitalize text-foreground">{day}</span>
                        <span className="text-muted-foreground">{h ? `${h.open} – ${h.close}` : "Closed"}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VenueDetail;
