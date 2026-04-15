import { useState, useRef, useEffect } from "react";
import { MessageSquare, Share2, Home, Car, Dog, Store, Wrench, Plus, MoreHorizontal, Flag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type FeedItem = { id: string; source: string; title: string; description?: string; photos?: string[]; created_at: string; badge: string; icon: any; entityType: EntityType; user_id?: string; };

const Wall = () => {
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string } | null>(null);
  const [newPost, setNewPost] = useState("");
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPost, setDialogPost] = useState("");
  const [dialogPhotos, setDialogPhotos] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

  const badgeLabel = (key: string, fallback: string) => t(`wall.badge.${key}`, fallback);

  const { data: wallPosts = [] } = useQuery({
    queryKey: ["wall-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("wall_posts").select("id, content, photos, user_id, created_at").is("group_id", null).order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({ id: item.id, source: "wall", title: item.content?.slice(0, 80), description: item.content?.length > 80 ? item.content : undefined, photos: item.photos || [], created_at: item.created_at, badge: "post", icon: MessageSquare, entityType: "wall_post" as EntityType, user_id: item.user_id }));
    },
  });

  const { data: classifieds = [] } = useQuery({
    queryKey: ["wall-classifieds"],
    queryFn: async () => {
      const { data } = await supabase.from("classifieds").select("id, title, description, section, created_at, user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({ id: item.id, source: "classifieds", title: item.title, description: item.description, created_at: item.created_at, badge: item.section === "rental" ? "rental" : item.section === "parking" ? "parking" : "classified", icon: item.section === "rental" ? Home : item.section === "parking" ? Car : Store, entityType: "classified" as EntityType, user_id: item.user_id }));
    },
  });

  const { data: petPosts = [] } = useQuery({
    queryKey: ["wall-pets"],
    queryFn: async () => {
      const { data } = await supabase.from("pet_posts").select("id, title, description, post_type, created_at, user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({ id: item.id, source: "pets", title: item.title, description: item.description, created_at: item.created_at, badge: "pets", icon: Dog, entityType: "pet_post" as EntityType, user_id: item.user_id }));
    },
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["wall-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("id, name, description, created_at, created_by_user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({ id: item.id, source: "venues", title: item.name, description: item.description, created_at: item.created_at, badge: "venue", icon: Store, entityType: "venue" as EntityType, user_id: item.created_by_user_id }));
    },
  });

  const { data: helpPosts = [] } = useQuery({
    queryKey: ["wall-help"],
    queryFn: async () => {
      const { data } = await supabase.from("neighbor_help_posts").select("id, title, description, help_type, created_at, user_id").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({ id: item.id, source: "help", title: item.title, description: item.description, created_at: item.created_at, badge: item.help_type === "offer" ? "help_offer" : "help_wanted", icon: Wrench, entityType: "help_post" as EntityType, user_id: item.user_id }));
    },
  });

  const postToWall = useMutation({
    mutationFn: async (params: { content: string; photos: string[] }) => {
      if (!user || (!params.content.trim() && params.photos.length === 0)) return;
      await supabase.from("wall_posts").insert({ content: params.content.trim(), user_id: user.id, photos: params.photos.length > 0 ? params.photos : [] });
    },
    onSuccess: () => { setNewPost(""); setNewPhotos([]); setDialogPost(""); setDialogPhotos([]); setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ["wall-posts"] }); },
  });

  const allItems: FeedItem[] = [...wallPosts, ...classifieds, ...petPosts, ...venues, ...helpPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50);

  const timeAgo = (date: string) => { const diff = Date.now() - new Date(date).getTime(); const mins = Math.floor(diff / 60000); if (mins < 60) return `${mins}m`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs}h`; return `${Math.floor(hrs / 24)}d`; };

  const BADGE_MAP: Record<string, { label: string; color: string }> = {
    post: { label: badgeLabel("post", "Post"), color: "secondary" },
    rental: { label: badgeLabel("rental", "Rental"), color: "default" },
    parking: { label: badgeLabel("parking", "Parking"), color: "secondary" },
    classified: { label: badgeLabel("classified", "Classified"), color: "secondary" },
    pets: { label: badgeLabel("pets", "Pets"), color: "outline" },
    venue: { label: badgeLabel("venue", "Venue"), color: "default" },
    help_offer: { label: badgeLabel("help_offer", "Help Offer"), color: "default" },
    help_wanted: { label: badgeLabel("help_wanted", "Help Wanted"), color: "secondary" },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"><MessageSquare className="w-8 h-8 text-primary" /></div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">{t("wall.title", "Community Wall")}</h1>
            <p className="text-muted-foreground">{t("wall.subtitle", "See what's happening in your neighborhood")}</p>
          </div>
          <Card className="mb-6 hidden sm:block">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar><AvatarFallback className="bg-primary text-primary-foreground">You</AvatarFallback></Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea ref={composerRef} placeholder={t("wall.placeholder", "Share something with your community...")} className="resize-none" rows={3} value={newPost} onChange={(e) => setNewPost(e.target.value)} />
                  <MediaUpload value={newPhotos} onChange={setNewPhotos} maxFiles={6} />
                  <Button disabled={(!newPost.trim() && newPhotos.length === 0) || !user} onClick={() => { if (!user) navigate("/auth"); else postToWall.mutate({ content: newPost, photos: newPhotos }); }}>{t("wall.post_btn", "Post")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="sm:hidden mb-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button className="w-full gap-2"><Plus className="w-4 h-4" /> {t("wall.add_post", "Add Post")}</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t("wall.new_post", "New Post")}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Textarea placeholder={t("wall.whats_on_mind", "What's on your mind?")} className="resize-none" rows={4} value={dialogPost} onChange={(e) => setDialogPost(e.target.value)} />
                  <MediaUpload value={dialogPhotos} onChange={setDialogPhotos} maxFiles={6} />
                  <Button className="w-full" disabled={(!dialogPost.trim() && dialogPhotos.length === 0) || !user} onClick={() => { if (!user) navigate("/auth"); else postToWall.mutate({ content: dialogPost, photos: dialogPhotos }); }}>{t("wall.post_btn", "Post")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {allItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>{t("wall.no_activity", "No activity yet. Be the first to post!")}</p></div>
          ) : (
            <div className="space-y-4">
              {allItems.map((item) => {
                const Icon = item.icon;
                const badge = BADGE_MAP[item.badge] || { label: item.badge, color: "secondary" };
                return (
                  <Card key={`${item.source}-${item.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {item.user_id && <UserName userId={item.user_id} showAvatar />}
                            <Badge variant={badge.color as any}>{badge.label}</Badge>
                            <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
                          </div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                        </div>
                        {user && item.user_id && item.user_id !== user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReportTarget({ type: item.source === "wall" ? "wall_post" : item.source === "classifieds" ? "classified" : item.source === "venues" ? "venue" : item.source === "help" ? "help_post" : item.entityType, id: item.id })}>
                                <Flag className="w-4 h-4 mr-2" /> {t("common.report", "Report")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    {item.photos && item.photos.length > 0 && <div className="px-6 pb-2"><MediaGrid urls={item.photos} /></div>}
                    <CardContent>
                      <div className="flex items-center gap-4 pt-2 border-t border-border">
                        <LikeButton entityType={item.entityType} entityId={item.id} />
                        <CommentsSection entityType={item.entityType} entityId={item.id} />
                        <Button variant="ghost" size="sm" className="gap-1"><Share2 className="w-4 h-4" /> {t("wall.share", "Share")}</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
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

export default Wall;
