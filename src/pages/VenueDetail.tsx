import { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Flag, Share2, Bookmark } from "lucide-react";
import { UserName } from "@/components/shared/UserName";
import { MediaGrid } from "@/components/shared/MediaGrid";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_PLACEHOLDERS: Record<string, { bg: string; emoji: string }> = {
  restaurant: { bg: "#FEF3C7", emoji: "🍽️" },
  cafe: { bg: "#FEF3C7", emoji: "☕" },
  bar: { bg: "#F5C4B3", emoji: "🍸" },
  nightlife: { bg: "#F5C4B3", emoji: "🍸" },
  health: { bg: "#E0F2FE", emoji: "🏥" },
  pharmacy: { bg: "#E0F2FE", emoji: "🏥" },
  culture: { bg: "#EDE9FE", emoji: "🎨" },
  sports: { bg: "#DCFCE7", emoji: "💪" },
  gym: { bg: "#DCFCE7", emoji: "💪" },
  pets: { bg: "#DCFCE7", emoji: "🐾" },
};

const getPlaceholder = (typeName?: string) => {
  if (!typeName) return { bg: "#EFF4FF", emoji: "📍" };
  const key = typeName.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_PLACEHOLDERS)) {
    if (key.includes(k)) return v;
  }
  return { bg: "#EFF4FF", emoji: "📍" };
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABELS_TR: Record<string, string> = { mon: "Pazartesi", tue: "Salı", wed: "Çarşamba", thu: "Perşembe", fri: "Cuma", sat: "Cumartesi", sun: "Pazar" };
const DAY_LABELS_EN: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

const isVenueOpen = (hours: Record<string, { open: string; close: string }> | null): boolean | null => {
  if (!hours || Object.keys(hours).length === 0) return null;
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const h = hours[dayKey];
  if (!h) return false;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= h.open && currentTime <= h.close;
};

const VenueDetail = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const DAY_LABELS = language === "tr" ? DAY_LABELS_TR : DAY_LABELS_EN;
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reportOpen, setReportOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !venueId) throw new Error("Login required");
      const { error } = await supabase.from("venue_reviews").insert({
        venue_id: venueId,
        user_id: user.id,
        rating: reviewRating,
        body: reviewText.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReviewText("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["venue-reviews", venueId] });
      toast({ title: t("venues.review_added", "Review added!") });
    },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-20 text-[#94A3B8] text-sm">Yükleniyor...</div>;
  if (!venue) return <div className="flex justify-center py-20 text-[#94A3B8] text-sm">Mekan bulunamadı</div>;

  const typeName = (venue as any).venue_types?.name;
  const ph = getPlaceholder(typeName);
  const hours = venue.hours as Record<string, { open: string; close: string }> | null;
  const openStatus = isVenueOpen(hours);
  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Photo header */}
      <div className="relative w-full h-[240px] overflow-hidden">
        {venue.cover_photo || (venue.photos as string[])?.[0] ? (
          <img src={venue.cover_photo || (venue.photos as string[])[0]} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: ph.bg }}>
            <span className="text-[48px]">{ph.emoji}</span>
          </div>
        )}
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        {user && (
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
          {/* Name + badges */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-xl font-bold" style={{ color: "#1E3A5F" }}>{venue.name}</h1>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {typeName && <Badge variant="outline" className="text-[10px]">{typeName}</Badge>}
              {openStatus !== null && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: openStatus ? "#DCFCE7" : "#FEF2F2",
                    color: openStatus ? "#166534" : "#DC2626",
                  }}
                >
                  {openStatus ? t("venues.open", "Open") : t("venues.closed", "Closed")}
                </span>
              )}
            </div>
          </div>

          {venue.description && <p className="text-sm mb-3" style={{ color: "#64748B", lineHeight: "1.6" }}>{venue.description}</p>}

          {/* Info section */}
          <div className="space-y-1.5 mb-3">
            {venue.address && (
              <p className="text-[12px] flex items-center gap-1.5" style={{ color: "#64748B" }}>
                <span>📍</span> {venue.address}
              </p>
            )}
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="text-[12px] flex items-center gap-1.5" style={{ color: "#1E3A5F" }}>
                <span>📞</span> {venue.phone}
              </a>
            )}
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-[12px] flex items-center gap-1.5 underline" style={{ color: "#1E3A5F" }}>
                <span>🌐</span> {venue.website}
              </a>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
            <button
              className="flex-1 py-2 rounded-lg text-white text-xs font-medium"
              style={{ backgroundColor: "#E74C3C" }}
              onClick={() => {
                if (!user) { navigate("/auth"); return; }
                if (venue?.created_by_user_id) navigate(`/messages?to=${venue.created_by_user_id}`);
              }}
            >
              {t("common.send_message", "Send Message")}
            </button>
            <button className="py-2 px-4 rounded-lg text-xs font-medium" style={{ border: "1px solid #1E3A5F", color: "#1E3A5F" }}>
              <Bookmark className="w-3.5 h-3.5 inline mr-1" />{t("common.save", "Save")}
            </button>
            <button
              className="py-2 px-4 rounded-lg text-xs font-medium"
              style={{ border: "1px solid #1E3A5F", color: "#1E3A5F" }}
              onClick={() => navigator.share?.({ url: window.location.href, title: venue.name }).catch(() => {})}
            >
              <Share2 className="w-3.5 h-3.5 inline mr-1" />{t("common.share", "Share")}
            </button>
          </div>

          {/* Added by */}
          {venue.created_by_user_id && (
            <div className="flex items-center gap-1.5 text-[11px] mb-1" style={{ color: "#94A3B8" }}>
              <UserName userId={venue.created_by_user_id} showAvatar avatarSize="w-4 h-4" className="text-[11px]" />
              <span>{t("venues.added_by", "added")}</span>
            </div>
          )}
        </div>

        {/* Photos gallery */}
        {venue.photos && (venue.photos as string[]).length > 1 && (
          <div className="mt-3 bg-card rounded-xl p-3" style={{ border: "1px solid #E2EBFC" }}>
            <MediaGrid urls={venue.photos as string[]} />
          </div>
        )}

        {/* Reviews section */}
        <div className="mt-3 bg-card rounded-xl p-4" style={{ border: "1px solid #E2EBFC" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
            <h2 className="text-sm font-semibold" style={{ color: "#1E3A5F" }}>{t("venues.reviews", "Reviews")}</h2>
              {reviews.length > 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                  ⭐ {avgRating.toFixed(1)} · {reviews.length} {language === "tr" ? "yorum" : "reviews"}
                </p>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm mb-2" style={{ color: "#94A3B8" }}>{t("venues.no_reviews", "No reviews yet. Be the first!")}</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="pb-3" style={{ borderBottom: "1px solid #E2EBFC" }}>
                  <div className="flex items-center justify-between mb-1">
                    <UserName userId={review.user_id} showAvatar avatarSize="w-6 h-6" className="text-[12px]" />
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-[12px]">{i < review.rating ? "⭐" : "☆"}</span>
                      ))}
                    </div>
                  </div>
                  {review.body && <p className="text-[12px] mt-1" style={{ color: "#374151", lineHeight: "1.5" }}>{review.body}</p>}
                  <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>
                    {new Date(review.created_at).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {review.reply_body && (
                    <div className="mt-2 pl-3" style={{ borderLeft: "2px solid #E2EBFC" }}>
                      <p className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>İşletme yanıtı:</p>
                      <p className="text-[12px]" style={{ color: "#374151" }}>{review.reply_body}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Write review */}
          {user && (
            <div className="pt-3" style={{ borderTop: reviews.length > 0 ? "none" : "1px solid #E2EBFC" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "#1E3A5F" }}>{language === "tr" ? "Yorum Yaz" : "Write a Review"}</p>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)} className="text-lg">
                    {star <= reviewRating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder={language === "tr" ? "Deneyiminizi paylaşın..." : "Share your experience..."}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={2}
                className="text-sm mb-2"
              />
              <Button
                variant="cta"
                size="sm"
                className="text-xs"
                disabled={submitReview.isPending}
                onClick={() => submitReview.mutate()}
              >
                {submitReview.isPending ? (language === "tr" ? "Gönderiliyor..." : "Sending...") : (language === "tr" ? "Yorum Gönder" : "Submit Review")}
              </Button>
            </div>
          )}
        </div>

        {/* Hours */}
        {hours && Object.keys(hours).length > 0 && (
          <div className="mt-3 mb-6 bg-card rounded-xl p-4" style={{ border: "1px solid #E2EBFC" }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: "#1E3A5F" }}>{t("venues.hours", "Business Hours")}</h2>
            <div className="space-y-1">
              {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
                const h = hours[day];
                const isToday = DAY_KEYS[new Date().getDay()] === day;
                return (
                  <div key={day} className="flex justify-between text-[12px]" style={{ fontWeight: isToday ? 600 : 400 }}>
                    <span style={{ color: isToday ? "#1E3A5F" : "#64748B" }}>{DAY_LABELS[day]}</span>
                    <span style={{ color: h ? "#374151" : "#94A3B8" }}>{h ? `${h.open} – ${h.close}` : t("venues.closed", "Closed")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu */}
        {menuItems.length > 0 && (
          <div className="mt-3 mb-6 bg-card rounded-xl p-4" style={{ border: "1px solid #E2EBFC" }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: "#1E3A5F" }}>Menü</h2>
            <div className="space-y-2">
              {menuItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #E2EBFC" }}>
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: "#374151" }}>{item.item_name}</p>
                    {item.description && <p className="text-[10px]" style={{ color: "#94A3B8" }}>{item.description}</p>}
                  </div>
                  {item.price && <span className="text-[12px] font-semibold" style={{ color: "#1E3A5F" }}>{item.currency || "₺"}{item.price}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deals */}
        {deals.length > 0 && (
          <div className="mt-3 mb-6 bg-card rounded-xl p-4" style={{ border: "1px solid #E2EBFC" }}>
            <h2 className="text-sm font-semibold mb-2" style={{ color: "#1E3A5F" }}>Fırsatlar</h2>
            {deals.map((deal: any) => (
              <div key={deal.id} className="py-2" style={{ borderBottom: "1px solid #E2EBFC" }}>
                <div className="flex items-center gap-2 mb-0.5">
                  {deal.discount_label && <Badge className="text-[9px] bg-[#E74C3C]">{deal.discount_label}</Badge>}
                  <span className="text-[12px] font-medium" style={{ color: "#374151" }}>{deal.title}</span>
                </div>
                {deal.description && <p className="text-[11px]" style={{ color: "#94A3B8" }}>{deal.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {venueId && (
        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} contentType="venue" contentId={venueId} />
      )}
    </div>
  );
};

export default VenueDetail;
