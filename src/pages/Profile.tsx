import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Edit2, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const isOwn = user?.id === userId;
  const [followersModal, setFollowersModal] = useState(false);
  const [followingModal, setFollowingModal] = useState(false);
  const [tab, setTab] = useState("posts");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId!).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: postsCount = 0 } = useQuery({
    queryKey: ["profile-posts-count", userId],
    queryFn: async () => {
      const { count } = await supabase.from("wall_posts").select("id", { count: "exact", head: true }).eq("user_id", userId!);
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_follows").select("follower_id").eq("following_id", userId!);
      if (!data?.length) return [];
      const ids = data.map(f => f.follower_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
      return profiles || [];
    },
    enabled: !!userId,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_follows").select("following_id").eq("follower_id", userId!);
      if (!data?.length) return [];
      const ids = data.map(f => f.following_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
      return profiles || [];
    },
    enabled: !!userId,
  });

  const { data: isFollowing, refetch: refetchFollow } = useQuery({
    queryKey: ["is-following", user?.id, userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_follows").select("id").eq("follower_id", user!.id).eq("following_id", userId!).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!userId && !isOwn,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["profile-posts", userId],
    queryFn: async () => {
      const { data } = await supabase.from("wall_posts").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["profile-listings", userId],
    queryFn: async () => {
      const { data } = await supabase.from("classifieds").select("*").eq("user_id", userId!).order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
    enabled: !!userId && tab === "listings",
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["profile-reviews", userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_reviews").select("*").eq("target_user_id", userId!).order("created_at", { ascending: false });
      if (!data?.length) return [];
      const reviewerIds = [...new Set(data.map(r => r.reviewer_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", reviewerIds);
      const pMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      return data.map(r => ({ ...r, reviewer: pMap[r.reviewer_id] }));
    },
    enabled: !!userId && tab === "reviews",
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["profile-groups", userId],
    queryFn: async () => {
      const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", userId!);
      if (!memberships?.length) return [];
      const gIds = memberships.map(m => m.group_id);
      const { data } = await supabase.from("groups").select("*").in("id", gIds);
      return data || [];
    },
    enabled: !!userId && tab === "groups",
  });

  const { data: districtName } = useQuery({
    queryKey: ["district-name", profile?.district_id],
    queryFn: async () => {
      const { data } = await supabase.from("districts").select("name").eq("id", profile!.district_id!).single();
      return data?.name || null;
    },
    enabled: !!profile?.district_id,
  });

  const handleFollow = async () => {
    if (!user) { navigate("/auth"); return; }
    if (isFollowing) {
      await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", userId!);
    } else {
      await supabase.from("user_follows").insert({ follower_id: user.id, following_id: userId! });
    }
    refetchFollow();
  };

  const startConversation = async () => {
    if (!user) { navigate("/auth"); return; }
    const { data: myConvs } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    if (myConvs?.length) {
      const convIds = myConvs.map(c => c.conversation_id);
      const { data: shared } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", userId!).in("conversation_id", convIds);
      if (shared?.length) { navigate(`/messages?conv=${shared[0].conversation_id}`); return; }
    }
    const { data: conv } = await supabase.from("conversations").insert({}).select().single();
    if (conv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: userId! },
      ]);
      navigate(`/messages?conv=${conv.id}`);
    }
  };

  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", { month: "long", year: "numeric" }) : "";

  if (isLoading) return <div className="flex justify-center py-20" style={{ color: "#64748B" }}>{t("common.loading", "Yükleniyor...")}</div>;
  if (!profile) return <div className="flex justify-center py-20" style={{ color: "#64748B" }}>{t("profile.user_not_found", "Kullanıcı bulunamadı")}</div>;

  const UserListModal = ({ open, onClose, title, users }: { open: boolean; onClose: () => void; title: string; users: any[] }) => (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {users.map(u => (
            <Link key={u.user_id} to={`/profile/${u.user_id}`} className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2" onClick={() => onClose()}>
              <Avatar className="w-8 h-8">
                <AvatarImage src={u.avatar_url || undefined} />
                <AvatarFallback style={{ background: "#1E3A5F", color: "#fff", fontSize: 12 }}>{(u.display_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#1E3A5F" }}>{u.display_name || t("common.user", "Kullanıcı")}</span>
            </Link>
          ))}
          {users.length === 0 && <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", padding: 16 }}>{t("profile.nobody_yet", "Henüz kimse yok")}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 py-6" style={{ maxWidth: 600 }}>
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar className="w-20 h-20 mb-3">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback style={{ background: "#1E3A5F", color: "#fff", fontSize: 24, fontWeight: 700 }}>{initials}</AvatarFallback>
          </Avatar>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1E3A5F" }}>{profile.display_name || t("profile.anonymous", "Anonim")}</h1>
          {(districtName || profile.neighborhood) && (
            <div className="flex items-center gap-1 mt-1" style={{ color: "#64748B", fontSize: 13 }}>
              <MapPin className="w-3 h-3" /> {districtName || profile.neighborhood}
            </div>
          )}
          {profile.bio && <p className="mt-2" style={{ fontSize: 13, color: "#64748B", maxWidth: 400 }}>{profile.bio}</p>}
          {memberSince && <p className="mt-1" style={{ fontSize: 12, color: "#64748B" }}>{t("profile.member_since", "Üye")}: {memberSince}</p>}
        </div>

        <div className="flex justify-center gap-0 mb-5">
          {[
            { n: postsCount, label: t("profile.posts", "Gönderi"), onClick: undefined },
            { n: followers.length, label: t("profile.followers", "Takipçi"), onClick: () => setFollowersModal(true) },
            { n: following.length, label: t("profile.following", "Takip"), onClick: () => setFollowingModal(true) },
          ].map((s, i) => (
            <button key={i} onClick={s.onClick} className="flex flex-col items-center px-5" style={{ borderRight: i < 2 ? "1px solid #E2E8F0" : "none", cursor: s.onClick ? "pointer" : "default" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F" }}>{s.n}</span>
              <span style={{ fontSize: 12, color: "#64748B" }}>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {isOwn ? (
            <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")} style={{ borderColor: "#1E3A5F", color: "#1E3A5F" }}>
              <Edit2 className="w-4 h-4 mr-1" /> {t("profile.edit_profile", "Profili Düzenle")}
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={startConversation} style={{ background: "#E74C3C", color: "#fff", border: "none" }}>
                <MessageSquare className="w-4 h-4 mr-1" /> {t("common.message", "Mesaj")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleFollow} style={{ borderColor: "#1E3A5F", color: isFollowing ? "#E74C3C" : "#1E3A5F" }}>
                <Users className="w-4 h-4 mr-1" /> {isFollowing ? t("profile.unfollow", "Takipten Çık") : t("profile.follow", "Takip Et")}
              </Button>
            </>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="posts" style={{ fontSize: 12 }}>{t("profile.tab.posts", "Gönderiler")}</TabsTrigger>
            <TabsTrigger value="listings" style={{ fontSize: 12 }}>{t("profile.tab.listings", "İlanlar")}</TabsTrigger>
            <TabsTrigger value="reviews" style={{ fontSize: 12 }}>{t("profile.tab.reviews", "Yorumlar")}</TabsTrigger>
            <TabsTrigger value="groups" style={{ fontSize: 12 }}>{t("profile.tab.groups", "Gruplar")}</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {posts.length === 0 ? <p className="text-center py-8" style={{ color: "#64748B", fontSize: 13 }}>{t("profile.no_posts", "Henüz gönderi yok")}</p> : (
              <div className="space-y-3 mt-3">
                {posts.map(p => (
                  <Card key={p.id}><CardContent className="py-3 px-4">
                    <p style={{ fontSize: 13, color: "#1E3A5F" }}>{p.content}</p>
                    <span style={{ fontSize: 12, color: "#64748B" }}>{new Date(p.created_at).toLocaleDateString("tr-TR")}</span>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="listings">
            {listings.length === 0 ? <p className="text-center py-8" style={{ color: "#64748B", fontSize: 13 }}>{t("profile.no_listings", "Henüz ilan yok")}</p> : (
              <div className="space-y-3 mt-3">
                {listings.map(l => (
                  <Card key={l.id}><CardContent className="py-3 px-4 flex items-center gap-3">
                    <Badge variant="secondary" style={{ fontSize: 12 }}>{l.section}</Badge>
                    <span className="flex-1 truncate" style={{ fontSize: 13, color: "#1E3A5F" }}>{l.title}</span>
                    {l.price && <span style={{ fontSize: 12, fontWeight: 600, color: "#E74C3C" }}>{l.price} {l.currency}</span>}
                  </CardContent></Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {reviews.length === 0 ? <p className="text-center py-8" style={{ color: "#64748B", fontSize: 13 }}>{t("profile.no_reviews", "Henüz yorum yok")}</p> : (
              <div className="space-y-3 mt-3">
                {reviews.map((r: any) => (
                  <Card key={r.id}><CardContent className="py-3 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Link to={`/profile/${r.reviewer_id}`} className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={r.reviewer?.avatar_url} />
                          <AvatarFallback style={{ fontSize: 12, background: "#1E3A5F", color: "#fff" }}>{(r.reviewer?.display_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#1E3A5F" }}>{r.reviewer?.display_name || t("common.user", "Kullanıcı")}</span>
                      </Link>
                      <span style={{ fontSize: 12 }}>{"⭐".repeat(r.rating)}</span>
                    </div>
                    {r.comment && <p style={{ fontSize: 13, color: "#64748B" }}>{r.comment}</p>}
                    <span style={{ fontSize: 12, color: "#64748B" }}>{new Date(r.created_at).toLocaleDateString("tr-TR")}</span>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups">
            {groups.length === 0 ? <p className="text-center py-8" style={{ color: "#64748B", fontSize: 13 }}>{t("profile.no_groups", "Henüz grup yok")}</p> : (
              <div className="space-y-3 mt-3">
                {groups.map(g => (
                  <Link key={g.id} to={`/groups/${g.id}`}>
                    <Card className="hover:shadow-sm transition-shadow"><CardContent className="py-3 px-4 flex items-center gap-3">
                      <Users className="w-5 h-5" style={{ color: "#1E3A5F" }} />
                      <div className="flex-1">
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F" }}>{g.name}</span>
                        <p style={{ fontSize: 12, color: "#64748B" }}>{g.member_count} {t("common.members", "üye")}</p>
                      </div>
                      <Badge variant="secondary" style={{ fontSize: 12 }}>{g.category}</Badge>
                    </CardContent></Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <UserListModal open={followersModal} onClose={() => setFollowersModal(false)} title={t("profile.followers_title", "Takipçiler")} users={followers} />
      <UserListModal open={followingModal} onClose={() => setFollowingModal(false)} title={t("profile.following_title", "Takip Edilenler")} users={following} />
    </div>
  );
};

export default Profile;
