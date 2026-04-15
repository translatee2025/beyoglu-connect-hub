import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquare, Home, Car, Dog, Store, Wrench, Plus, MoreHorizontal, Flag, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/providers/LanguageProvider";
import { LikeButton } from "@/components/social/LikeButton";
import { type EntityType } from "@/hooks/useLikes";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { MediaGrid } from "@/components/shared/MediaGrid";
import { UserName } from "@/components/shared/UserName";
import { CommentsSection } from "@/components/shared/CommentsSection";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type FeedItem = {
  id: string;
  source: string;
  title: string;
  description?: string;
  photos?: string[];
  created_at: string;
  badge: string;
  icon: any;
  entityType: EntityType;
  user_id?: string;
  price?: string;
  details?: string;
  cardStyle: "listing" | "social";
};

type FilterKey = "all" | "rentals" | "events" | "community";

const FILTER_KEYS: { key: FilterKey; tKey: string; fallback: string; emoji?: string }[] = [
  { key: "all", tKey: "feed.filter.all", fallback: "All" },
  { key: "rentals", tKey: "feed.filter.rentals", fallback: "Rentals", emoji: "🏠" },
  { key: "events", tKey: "feed.filter.events", fallback: "Events", emoji: "📅" },
  { key: "community", tKey: "feed.filter.community", fallback: "Community", emoji: "👥" },
];

const ALLOWED_DISTRICTS = ["beyoğlu", "şişli", "kadıköy", "beşiktaş"];

const Wall = () => {
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);
  const [newPost, setNewPost] = useState("");
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPost, setDialogPost] = useState("");
  const [dialogPhotos, setDialogPhotos] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>("49d72979-361f-422b-b3fd-0407b947ee94");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const { t, language } = useLanguage();

  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data } = await supabase.from("districts").select("id, name").order("name", { ascending: true });
      return (data || []).filter((d: any) =>
        ALLOWED_DISTRICTS.includes(d.name.toLowerCase())
      ) as { id: string; name: string }[];
    },
  });

  const { data: userDistrictId = null } = useQuery({
    queryKey: ["user-district", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("district_id").eq("user_id", user.id).limit(1).single();
      return data?.district_id || null;
    },
    enabled: !!user,
  });

  const badgeLabel = (key: string, fallback: string) => t(`wall.badge.${key}`, fallback);

  const { data: wallPosts = [], isLoading: wallLoading } = useQuery({
    queryKey: ["wall-posts", selectedDistrict],
    queryFn: async () => {
      let q = supabase.from("wall_posts").select("id, content, photos, user_id, created_at").is("group_id", null);
      if (selectedDistrict) q = q.eq("district_id", selectedDistrict);
      const { data } = await q.order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "wall", title: item.content?.slice(0, 80),
        description: item.content?.length > 80 ? item.content : undefined,
        photos: item.photos || [], created_at: item.created_at,
        badge: "post", icon: MessageSquare, entityType: "wall_post" as EntityType,
        user_id: item.user_id, cardStyle: "social" as const,
      }));
    },
  });

  const { data: classifieds = [] } = useQuery({
    queryKey: ["wall-classifieds"],
    queryFn: async () => {
      const { data } = await supabase.from("classifieds").select("id, title, description, section, price, currency, created_at, user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "classifieds", title: item.title, description: item.description,
        created_at: item.created_at,
        badge: item.section === "rental" ? "rental" : item.section === "parking" ? "parking" : "classified",
        icon: item.section === "rental" ? Home : item.section === "parking" ? Car : Store,
        entityType: "classified" as EntityType, user_id: item.user_id,
        price: item.price ? `${item.price} ${item.currency || '₺'}` : undefined,
        cardStyle: "listing" as const,
      }));
    },
  });

  const { data: petPosts = [] } = useQuery({
    queryKey: ["wall-pets"],
    queryFn: async () => {
      const { data } = await supabase.from("pet_posts").select("id, title, description, post_type, created_at, user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "pets", title: item.title, description: item.description,
        created_at: item.created_at, badge: "pet", icon: Dog,
        entityType: "pet_post" as EntityType, user_id: item.user_id,
        cardStyle: "social" as const,
      }));
    },
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["wall-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("id, name, description, created_at, created_by_user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "venues", title: item.name, description: item.description,
        created_at: item.created_at, badge: "venue", icon: Store,
        entityType: "venue" as EntityType, user_id: item.created_by_user_id,
        cardStyle: "social" as const,
      }));
    },
  });

  const { data: helpPosts = [] } = useQuery({
    queryKey: ["wall-help"],
    queryFn: async () => {
      const { data } = await supabase.from("neighbor_help_posts").select("id, title, description, help_type, created_at, user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "help", title: item.title, description: item.description,
        created_at: item.created_at, badge: "helper", icon: Wrench,
        entityType: "help_post" as EntityType, user_id: item.user_id,
        cardStyle: "social" as const,
      }));
    },
  });

  const postToWall = useMutation({
    mutationFn: async (params: { content: string; photos: string[] }) => {
      if (!user || (!params.content.trim() && params.photos.length === 0)) return;
      await supabase.from("wall_posts").insert({ content: params.content.trim(), user_id: user.id, photos: params.photos.length > 0 ? params.photos : [], district_id: userDistrictId });
    },
    onSuccess: () => { setNewPost(""); setNewPhotos([]); setDialogPost(""); setDialogPhotos([]); setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ["wall-posts"] }); },
  });

  useEffect(() => {
    const filter = selectedDistrict
      ? `group_id=is.null,district_id=eq.${selectedDistrict}`
      : `group_id=is.null`;
    const channel = supabase
      .channel(`wall-realtime-${selectedDistrict ?? 'all'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wall_posts', filter },
        (payload) => {
          const row = payload.new as any;
          if (row.group_id) return;
          const newItem: FeedItem = { id: row.id, source: "wall", title: row.content?.slice(0, 80), description: row.content?.length > 80 ? row.content : undefined, photos: row.photos || [], created_at: row.created_at, badge: "post", icon: MessageSquare, entityType: "wall_post" as EntityType, user_id: row.user_id, cardStyle: "social" };
          queryClient.setQueryData<FeedItem[]>(["wall-posts"], (old) => old ? [newItem, ...old] : [newItem]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, selectedDistrict]);

  const allItems: FeedItem[] = [...wallPosts, ...classifieds, ...petPosts, ...venues, ...helpPosts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  const filteredItems = allItems.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "rentals") return ["rental", "parking", "classified"].includes(item.badge);
    if (activeFilter === "events") return item.badge === "event" || item.source === "events";
    if (activeFilter === "community") return ["post", "pet", "helper", "venue"].includes(item.badge);
    return true;
  });

  const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const timeAgo = (date: string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    const months = language === "tr" ? MONTHS_TR : MONTHS_EN;
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const BADGE_MAP: Record<string, { label: string; variant: string }> = {
    post: { label: t("feed.badge.post", "Post"), variant: "post" },
    rental: { label: t("feed.badge.rental", "Rental"), variant: "rental" },
    parking: { label: t("feed.badge.parking", "Parking"), variant: "classified" },
    classified: { label: t("feed.badge.classified", "Classified"), variant: "classified" },
    pet: { label: t("feed.badge.pets", "Pets"), variant: "pet" },
    venue: { label: t("feed.badge.venue", "Venue"), variant: "venue" },
    helper: { label: t("feed.badge.help_offer", "Help"), variant: "helper" },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Scope selector bar */}
      <div className="sticky top-[48px] z-40 bg-card" style={{ padding: '8px 16px', borderBottom: '1px solid #E2EBFC' }}>
        <div className="flex gap-2 justify-center max-w-[680px] mx-auto">
          <button
            onClick={() => setSelectedDistrict(null)}
            className="flex-shrink-0 transition-all text-xs"
            style={{
              padding: '4px 14px', borderRadius: '20px',
              ...(selectedDistrict === null
                ? { backgroundColor: '#1E3A5F', color: 'white', border: 'none', fontWeight: 500 }
                : { backgroundColor: 'white', border: '0.5px solid #C7D7F7', color: '#64748B' }),
            }}
          >
            İstanbul
          </button>
          {districts.map((d) => (
            <button
              key={d.id}
              data-district-id={d.id}
              onClick={() => setSelectedDistrict(d.id)}
              className="flex-shrink-0 transition-all text-xs"
              style={{
                padding: '4px 14px', borderRadius: '20px',
                ...(selectedDistrict === d.id
                  ? { backgroundColor: '#1E3A5F', color: 'white', border: 'none', fontWeight: 500 }
                  : { backgroundColor: 'white', border: '0.5px solid #C7D7F7', color: '#64748B' }),
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto px-4 py-4" style={{ maxWidth: '680px' }}>
        {/* Filter bar */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {FILTER_KEYS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="flex-shrink-0 flex items-center gap-1.5 transition-all text-xs"
              style={{
                padding: '6px 14px', borderRadius: '20px',
                ...(activeFilter === f.key
                  ? { backgroundColor: '#1E3A5F', color: 'white', border: '1px solid #1E3A5F', fontWeight: 500 }
                  : { backgroundColor: 'white', border: '1px solid #E2EBFC', color: '#64748B' }),
              }}
            >
              {f.emoji && <span>{f.emoji}</span>}
              {t(f.tKey, f.fallback)}
            </button>
          ))}
        </div>

        {/* Post Composer - desktop */}
        <div className="mb-4 hidden sm:block rounded-xl p-3" style={{ backgroundColor: '#EFF4FF', border: '1px solid #C7D7F7' }}>
          <div className="flex gap-3">
            <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-medium" style={{ backgroundColor: '#1E3A5F' }}>
              {user?.email?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-card rounded-full" style={{ border: '0.5px solid #C7D7F7' }}>
                <Textarea
                  ref={composerRef}
                  placeholder={t("wall.placeholder", "Share something with your community...")}
                  className="resize-none border-0 bg-transparent rounded-full min-h-[40px] py-2.5 px-4 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ color: '#1E3A5F' }}
                  rows={1}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
              </div>
              <MediaUpload value={newPhotos} onChange={setNewPhotos} maxFiles={6} />
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {[
                    { label: '📸 Photo', key: 'photo' },
                    { label: '📍 Location', key: 'location' },
                    { label: '🏠 Rental', key: 'rental' },
                  ].map((btn) => (
                    <span key={btn.key} className="text-xxs px-2 py-0.5 rounded-md cursor-pointer transition-colors" style={{ border: '0.5px solid #C7D7F7', color: '#64748B' }}>
                      {btn.label}
                    </span>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="cta"
                  disabled={(!newPost.trim() && newPhotos.length === 0) || !user}
                  onClick={() => { if (!user) navigate("/auth"); else postToWall.mutate({ content: newPost, photos: newPhotos }); }}
                  className="text-xs"
                >
                  {t("wall.post_btn", "Post")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile compose button */}
        <div className="sm:hidden mb-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="cta" className="w-full gap-2 text-xs"><Plus className="w-4 h-4" /> {t("wall.add_post", "Add Post")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[20px] sm:rounded-xl">
              <div className="w-9 h-1 bg-[#D1D5DB] rounded-full mx-auto mb-2 sm:hidden" />
              <DialogHeader><DialogTitle className="text-sm font-semibold">{t("wall.new_post", "New Post")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Textarea placeholder={t("wall.whats_on_mind", "What's on your mind?")} className="resize-none text-sm" rows={4} value={dialogPost} onChange={(e) => setDialogPost(e.target.value)} />
                <MediaUpload value={dialogPhotos} onChange={setDialogPhotos} maxFiles={6} />
                <Button variant="cta" className="w-full text-xs" disabled={(!dialogPost.trim() && dialogPhotos.length === 0) || !user} onClick={() => { if (!user) navigate("/auth"); else postToWall.mutate({ content: dialogPost, photos: dialogPhotos }); }}>{t("wall.post_btn", "Post")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Feed */}
        {wallLoading ? (
          <SkeletonFeedList count={3} />
        ) : filteredItems.length === 0 ? (
          <EmptyState emoji="🌟" message={t("empty.feed", "Henüz gönderi yok. İlk gönderiyi sen yap! 🌟")} actionLabel={t("common.post", "Paylaş")} onAction={() => {}} />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const badge = BADGE_MAP[item.badge] || { label: item.badge, variant: "post" };

              if (item.cardStyle === "listing") {
                return <ListingCard key={`${item.source}-${item.id}`} item={item} badge={badge} timeAgo={timeAgo} user={user} setReportTarget={setReportTarget} t={t} />;
              }
              return <SocialCard key={`${item.source}-${item.id}`} item={item} badge={badge} timeAgo={timeAgo} user={user} setReportTarget={setReportTarget} t={t} />;
            })}
          </div>
        )}
      </div>
      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={(o) => { if (!o) setReportTarget(null); }}
          contentType={reportTarget.type}
          contentId={reportTarget.id}
        />
      )}
    </div>
  );
};

/* ── Listing Card ── */
const ListingCard = ({ item, badge, timeAgo, user, setReportTarget, t }: any) => (
  <div className="bg-card rounded-xl overflow-hidden transition-colors hover:bg-[#FAFCFF]" style={{ border: '1px solid #E2EBFC' }}>
    {/* Photo area */}
    <div className="relative h-[200px] overflow-hidden" style={{ backgroundColor: '#EFF4FF' }}>
      {item.photos && item.photos.length > 0 ? (
        <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <item.icon className="w-10 h-10 text-[#94A3B8] opacity-40" />
        </div>
      )}
      {item.price && (
        <span className="absolute bottom-2 right-2 bg-white text-[#1E3A5F] text-xs font-bold px-2 py-0.5 rounded" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {item.price}
        </span>
      )}
    </div>
    {/* Body */}
    <div className="p-3">
      <div className="flex items-center justify-between mb-1">
        <Badge variant={badge.variant as any}>{badge.label}</Badge>
        <ReportMenu item={item} user={user} setReportTarget={setReportTarget} t={t} />
      </div>
      {item.title && <p className="text-sm font-semibold" style={{ color: '#1E3A5F' }}>{item.title}</p>}
      {item.details && <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{item.details}</p>}
      {item.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#64748B', lineHeight: '1.5' }}>{item.description}</p>}
      {/* Poster row */}
      <div className="flex items-center gap-1.5 mt-2">
        {item.user_id && <UserName userId={item.user_id} showAvatar avatarSize="w-4 h-4" className="text-[11px]" />}
        <span className="text-[11px] text-[#94A3B8]">· {timeAgo(item.created_at)}</span>
      </div>
      {/* CTA */}
      <button className="w-full mt-2.5 py-2 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: '#E74C3C' }}>
        {t("wall.message", "Mesaj Gönder")}
      </button>
    </div>
  </div>
);

/* ── Social Card ── */
const SocialCard = ({ item, badge, timeAgo, user, setReportTarget, t }: any) => (
  <div className="bg-card rounded-xl p-3.5 transition-colors hover:bg-[#FAFCFF]" style={{ border: '1px solid #E2EBFC' }}>
    {/* Header */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        {item.user_id && <UserName userId={item.user_id} showAvatar avatarSize="w-8 h-8" className="text-[13px] font-medium" />}
        <span className="text-[11px] text-[#94A3B8]">· {timeAgo(item.created_at)}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Badge variant={badge.variant as any}>{badge.label}</Badge>
        <ReportMenu item={item} user={user} setReportTarget={setReportTarget} t={t} />
      </div>
    </div>
    {/* Body */}
    {item.title && <p className="text-[13px] font-medium text-foreground mt-2">{item.title}</p>}
    {item.description && <p className="text-[13px] text-foreground mt-0.5 line-clamp-3" style={{ lineHeight: '1.6' }}>{item.description}</p>}
    {/* Photos */}
    {item.photos && item.photos.length > 0 && (
      <div className="mt-2.5 rounded-lg overflow-hidden" style={{ maxHeight: '220px' }}>
        <MediaGrid urls={item.photos} />
      </div>
    )}
    {/* Actions */}
    <div className="flex items-center gap-3.5 mt-2.5 pt-2" style={{ borderTop: '1px solid #E2EBFC' }}>
      <LikeButton entityType={item.entityType} entityId={item.id} />
      <CommentsSection entityType={item.entityType} entityId={item.id} />
      <button className="text-[11px] font-medium ml-auto" style={{ color: '#94A3B8' }}>{t("wall.message", "Message")}</button>
    </div>
  </div>
);

/* ── Report Menu ── */
const ReportMenu = ({ item, user, setReportTarget, t }: any) => {
  if (!user || !item.user_id || item.user_id === user.id) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 text-[#94A3B8] hover:text-foreground"><MoreHorizontal className="w-3.5 h-3.5" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setReportTarget({ type: item.source === "wall" ? "wall_post" : item.source === "classifieds" ? "classified" : item.source === "venues" ? "venue" : item.source === "help" ? "help_post" : item.entityType, id: item.id })} className="text-xs">
          <Flag className="w-3.5 h-3.5 mr-2" /> {t("common.report", "Report")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Wall;
