import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, MapPin, Plus, Send, X, ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { UserName } from "@/components/shared/UserName";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Reel {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  venue_id: string | null;
  neighborhood: string | null;
  created_at: string;
  venue?: { id: string; name: string } | null;
}

const Reels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postOpen, setPostOpen] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data: reels = [] } = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reels")
        .select("*, venue:venues(id, name)")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as Reel[];
    },
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const reelIds = reels.map((r) => r.id);
      if (!reelIds.length) return;
      const { data } = await supabase
        .from("likes")
        .select("entity_id")
        .eq("entity_type", "reel")
        .eq("user_id", user.id)
        .in("entity_id", reelIds);
      if (data) setLikedReels(new Set(data.map((d) => d.entity_id)));
    })();
  }, [user, reels]);

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["reel-comments", reels[currentIndex]?.id],
    queryFn: async () => {
      const reelId = reels[currentIndex]?.id;
      if (!reelId) return [];
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id")
        .eq("entity_type", "reel")
        .eq("entity_id", reelId)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: showComments && reels.length > 0,
  });

  const { data: likeCounts = {} } = useQuery({
    queryKey: ["reel-like-counts", reels.map(r => r.id).join(",")],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const reel of reels) {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("entity_type", "reel")
          .eq("entity_id", reel.id);
        counts[reel.id] = count || 0;
      }
      return counts;
    },
    enabled: reels.length > 0,
  });

  const handleLike = async () => {
    const reel = reels[currentIndex];
    if (!reel || !user) { if (!user) navigate("/auth"); return; }
    const isLiked = likedReels.has(reel.id);
    if (isLiked) {
      await supabase.from("likes").delete().eq("entity_type", "reel").eq("entity_id", reel.id).eq("user_id", user.id);
      setLikedReels((prev) => { const s = new Set(prev); s.delete(reel.id); return s; });
    } else {
      await supabase.from("likes").insert({ entity_type: "reel", entity_id: reel.id, user_id: user.id });
      setLikedReels((prev) => new Set([...prev, reel.id]));
    }
    queryClient.invalidateQueries({ queryKey: ["reel-like-counts"] });
  };

  const handleAddComment = async () => {
    const reel = reels[currentIndex];
    if (!reel || !user || !newComment.trim()) return;
    await supabase.from("comments").insert({
      entity_type: "reel", entity_id: reel.id, user_id: user.id, content: newComment.trim(),
    });
    setNewComment("");
    refetchComments();
  };

  const handleShare = async () => {
    const reel = reels[currentIndex];
    if (!reel) return;
    const url = `${window.location.origin}/reels`;
    if (navigator.share) {
      await navigator.share({ title: reel.caption || t("reels.title", "Reels"), url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: t("reels.link_copied", "Link kopyalandı!") });
    }
  };

  const goNext = () => {
    if (isTransitioning || currentIndex >= reels.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex((i) => i + 1);
    setShowComments(false);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goPrev = () => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((i) => i - 1);
    setShowComments(false);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) goNext();
    else if (e.deltaY < 0) goPrev();
  };

  const currentReel = reels[currentIndex];

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden z-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="text-white bg-black/40 rounded-full" onClick={() => navigate(-1)}>
          <X className="w-5 h-5" />
        </Button>
        <h1 className="text-white font-bold text-lg">{t("reels.title", "Reels")}</h1>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white bg-black/40 rounded-full">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <ReelPostForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["reels"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      {currentReel ? (
        <div className="relative h-full w-full" key={currentReel.id}>
          <div className="absolute inset-0">
            {currentReel.media_type === "video" ? (
              <video src={currentReel.media_url} className="h-full w-full object-cover" autoPlay loop playsInline muted />
            ) : (
              <img src={currentReel.media_url} alt={currentReel.caption || "Reel"} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          <div className="absolute bottom-20 left-4 right-20 z-10">
            <UserName userId={currentReel.user_id} showAvatar className="text-white mb-2" />
            {currentReel.caption && <p className="text-white text-sm mb-2 line-clamp-3">{currentReel.caption}</p>}
            {currentReel.venue && (
              <button className="flex items-center gap-1 text-white/80 text-xs hover:text-white" onClick={() => navigate(`/venues`)}>
                <MapPin className="w-3 h-3" /> {currentReel.venue.name}
              </button>
            )}
            {currentReel.neighborhood && !currentReel.venue && (
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <MapPin className="w-3 h-3" /> {currentReel.neighborhood}
              </div>
            )}
          </div>

          <div className="absolute right-4 bottom-24 flex flex-col gap-5 z-10">
            <button className="flex flex-col items-center gap-1" onClick={handleLike}>
              <div className={`rounded-full h-12 w-12 flex items-center justify-center ${likedReels.has(currentReel.id) ? "bg-red-500" : "bg-white/20"} backdrop-blur-sm`}>
                <Heart className={`w-6 h-6 text-white ${likedReels.has(currentReel.id) ? "fill-white" : ""}`} />
              </div>
              <span className="text-xs text-white">{likeCounts[currentReel.id] || 0}</span>
            </button>
            <button className="flex flex-col items-center gap-1" onClick={() => setShowComments(!showComments)}>
              <div className="rounded-full h-12 w-12 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white">{t("reels.comments", "Yorumlar")}</span>
            </button>
            <button className="flex flex-col items-center gap-1" onClick={handleShare}>
              <div className="rounded-full h-12 w-12 bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white">{t("reels.share", "Paylaş")}</span>
            </button>
          </div>

          {currentIndex > 0 && (
            <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200%] z-10" onClick={goPrev}>
              <ChevronUp className="w-8 h-8 text-white/50" />
            </button>
          )}
          {currentIndex < reels.length - 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs flex flex-col items-center">
              <ChevronDown className="w-6 h-6 animate-bounce" />
              <span>{t("reels.swipe_up", "Yukarı kaydır")}</span>
            </div>
          )}

          {showComments && (
            <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t z-50 flex flex-col h-[55vh] rounded-t-2xl">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-bold text-foreground">{t("reels.comments", "Yorumlar")}</h3>
                <button onClick={() => setShowComments(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-3 border-b">
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t("reels.add_comment", "Yorum ekle...")}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {comments.map((c: any) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <UserName userId={c.user_id} showAvatar className="text-xs" />
                          <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("reels.no_comments", "Henüz yorum yok")}</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/60 mb-4">{t("reels.no_reels", "Henüz reel yok. İlk paylaşan siz olun!")}</p>
            <Button onClick={() => setPostOpen(true)}>{t("reels.create", "Reel Oluştur")}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReelPostForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [media, setMedia] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("common.please_login", "Lütfen giriş yapın"));
      if (!media.length) throw new Error(t("reels.add_media", "Fotoğraf veya video ekleyin"));
      const { error } = await supabase.from("reels").insert({
        user_id: user.id,
        media_url: media[0],
        media_type: media[0].includes("video") ? "video" : "image",
        caption: caption || null,
        neighborhood: neighborhood || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("reels.posted", "Reel paylaşıldı! 🎬") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Hata"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{t("reels.create", "Reel Oluştur")}</DialogTitle></DialogHeader>
      <div><Label>{t("reels.media", "Fotoğraf veya Video")} *</Label><MediaUpload value={media} onChange={setMedia} maxFiles={1} /></div>
      <div><Label>{t("reels.caption", "Açıklama")}</Label><Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={t("reels.caption_placeholder", "Neler oluyor?")} rows={3} /></div>
      <div><Label>{t("common.neighborhood", "Mahalle")}</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder={t("common.neighborhood_placeholder", "ör. Cihangir")} /></div>
      <Button className="w-full" onClick={() => mutation.mutate()} disabled={!media.length || mutation.isPending}>
        {mutation.isPending ? t("common.posting", "Paylaşılıyor...") : t("reels.post", "Reel Paylaş")}
      </Button>
    </div>
  );
};

export default Reels;
