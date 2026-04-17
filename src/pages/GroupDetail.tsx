import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, ArrowLeft, Plus, MessageSquare, Share2, LogOut, CheckCircle, XCircle } from "lucide-react";
import { LikeButton } from "@/components/social/LikeButton";
import { CommentsSection } from "@/components/shared/CommentsSection";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { MediaGrid } from "@/components/shared/MediaGrid";
import { UserName } from "@/components/shared/UserName";

// timeAgo is defined inside the component below

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === "tr" ? "şimdi" : "now";
    if (mins < 60) return language === "tr" ? `${mins}dk` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return language === "tr" ? `${hrs}s` : `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return language === "tr" ? `${days}g` : `${days}d`;
  };
  const [postOpen, setPostOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postPhotos, setPostPhotos] = useState<string[]>([]);

  const { data: group } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: membership, refetch: refetchMembership } = useQuery({
    queryKey: ["group-membership", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("group_members").select("role").eq("group_id", id!).eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const isMember = membership?.role === "member" || membership?.role === "owner" || membership?.role === "admin";
  const isOwner = membership?.role === "owner";

  const { data: posts = [] } = useQuery({
    queryKey: ["group-posts", id],
    queryFn: async () => {
      const { data } = await supabase.from("wall_posts").select("id, content, photos, user_id, created_at, status")
        .eq("group_id", id!).or("status.eq.active,status.is.null").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["group-members", id],
    queryFn: async () => {
      const { data: memberRows } = await supabase.from("group_members").select("user_id, role").eq("group_id", id!);
      if (!memberRows?.length) return [];
      const userIds = memberRows.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      return memberRows.map(m => ({ ...m, profile: profiles?.find(p => p.user_id === m.user_id) }));
    },
    enabled: !!id,
  });

  // Pending requests (for owner)
  const pendingMembers = members.filter(m => m.role === "pending");
  const activeMembers = members.filter(m => m.role !== "pending" && m.role !== "rejected");

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!user || (!postContent.trim() && postPhotos.length === 0)) return;
      const { error } = await supabase.from("wall_posts").insert({
        content: postContent.trim(), user_id: user.id, group_id: id!,
        photos: postPhotos.length > 0 ? postPhotos : [], status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPostContent(""); setPostPhotos([]); setPostOpen(false);
      queryClient.invalidateQueries({ queryKey: ["group-posts", id] });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error", "Error"), description: err.message, variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user || !group) throw new Error("Not authenticated");
      const role = group.group_type === "request" ? "pending" : "member";
      const { error } = await supabase.from("group_members").insert({ group_id: id!, user_id: user.id, role });
      if (error) throw error;
      if (role === "member") {
        await supabase.from("groups").update({ member_count: (group.member_count || 0) + 1 }).eq("id", id!);
      }
      if (role === "pending") {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        await supabase.from("notifications").insert({
          user_id: group.created_by, type: "group_request",
          title: "Grup katılma isteği",
          body: `${profile?.display_name || "Birisi"} gruba katılmak istiyor`,
          link: `/groups/${group.id}`,
        });
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: group?.group_type === "request" ? "Katılma isteği gönderildi" : "Gruba katıldınız" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("group_members").delete().eq("group_id", id!).eq("user_id", user.id);
      if (error) throw error;
      if (group) {
        await supabase.from("groups").update({ member_count: Math.max(0, (group.member_count || 1) - 1) }).eq("id", id!);
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: t("groups.toast.left", "Gruptan ayrıldınız") });
    },
  });

  // Accept/Reject join requests
  const handleRequest = async (targetUserId: string, action: "accept" | "reject") => {
    if (action === "accept") {
      await supabase.from("group_members").update({ role: "member" }).eq("group_id", id!).eq("user_id", targetUserId);
      if (group) {
        await supabase.from("groups").update({ member_count: (group.member_count || 0) + 1 }).eq("id", id!);
      }
      await supabase.from("notifications").insert({
        user_id: targetUserId, type: "group_request_accepted",
        title: "Katılma isteği kabul edildi",
        body: `"${group?.name}" grubuna katılma isteğin kabul edildi`,
        link: `/groups/${id}`,
      });
      toast({ title: "Üye kabul edildi" });
    } else {
      await supabase.from("group_members").update({ role: "rejected" }).eq("group_id", id!).eq("user_id", targetUserId);
      await supabase.from("notifications").insert({
        user_id: targetUserId, type: "group_request_rejected",
        title: "Katılma isteği reddedildi",
        body: `"${group?.name}" grubuna katılma isteğin reddedildi`,
        link: `/groups/${id}`,
      });
      toast({ title: "İstek reddedildi" });
    }
    invalidateAll();
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["group-membership", id, user?.id] });
    queryClient.invalidateQueries({ queryKey: ["group-members", id] });
    queryClient.invalidateQueries({ queryKey: ["group", id] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  const handleMessage = async (targetUserId: string) => {
    if (!user) { navigate("/auth"); return; }
    const { data: myConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    if (myConvos?.length) {
      const convIds = myConvos.map(c => c.conversation_id);
      const { data: theirConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", targetUserId).in("conversation_id", convIds);
      if (theirConvos?.length) { navigate(`/messages?conv=${theirConvos[0].conversation_id}`); return; }
    }
    const { data: conv } = await supabase.from("conversations").insert({ type: "dm" }).select("id").single();
    if (conv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: targetUserId },
      ]);
      navigate(`/messages?conv=${conv.id}`);
    }
  };

  if (!group) return <div className="min-h-screen bg-background flex items-center justify-center" style={{ color: "#94A3B8" }}>Yükleniyor...</div>;

  const typeBadge = group.group_type === "public"
    ? { label: t("groups.public_short", "Public"), bg: "#DCFCE7", color: "#16A34A" }
    : group.group_type === "request"
      ? { label: t("groups.request_label", "Request"), bg: "#FEF3C7", color: "#D97706" }
      : { label: t("groups.private_label", "Private"), bg: "#E0F2FE", color: "#1E3A5F" };

  return (
    <div className="mx-auto px-4 py-6" style={{ maxWidth: 680 }}>
      {/* Back */}
      <button onClick={() => navigate("/groups")} className="flex items-center gap-1 mb-4" style={{ fontSize: 13, color: "#64748B" }}>
        <ArrowLeft className="w-4 h-4" /> {t("common.back", "Back")}
      </button>

      {/* Header card */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1px solid #E2EBFC" }}>
        {group.cover_photo && (
          <img src={group.cover_photo} alt="" className="w-full object-cover" style={{ height: 160 }} />
        )}
        <div style={{ padding: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1E3A5F", marginBottom: 6 }}>{group.name}</h1>
          {group.description && <p style={{ fontSize: 13, color: "#64748B", marginBottom: 10, lineHeight: 1.5 }}>{group.description}</p>}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: typeBadge.bg, color: typeBadge.color }}>{typeBadge.label}</span>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>👥 {group.member_count} {language === "tr" ? "üye" : "members"}</span>
          </div>

          {/* Action buttons */}
          {!user ? (
            <Button className="w-full" onClick={() => navigate("/auth")} style={{ background: "#1E3A5F", color: "#fff" }}>Katıl</Button>
          ) : isMember ? (
            <div className="flex gap-2">
              {isOwner ? (
                <Button variant="secondary" className="flex-1" disabled style={{ fontSize: 12 }}>👑 {t("groups.admin", "Admin")}</Button>
              ) : (
                <Button variant="outline" className="flex-1 gap-1" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} style={{ fontSize: 12, borderColor: "#E74C3C", color: "#E74C3C" }}>
                  <LogOut className="w-3.5 h-3.5" /> Gruptan Ayrıl
                </Button>
              )}
            </div>
          ) : membership?.role === "pending" ? (
            <Button variant="secondary" className="w-full" disabled style={{ fontSize: 12 }}>⏳ İstek Gönderildi</Button>
          ) : (
            <Button className="w-full" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} style={{ background: "#1E3A5F", color: "#fff", fontSize: 12 }}>
              {group.group_type === "request" ? t("groups.send_request", "Request") : t("groups.join", "Join")}
            </Button>
          )}
        </div>
      </div>

      {/* Pending requests for owner */}
      {isOwner && pendingMembers.length > 0 && (
        <div className="rounded-xl p-4 mb-5" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#92400E", marginBottom: 8 }}>
            📋 {pendingMembers.length} katılma isteği
          </h3>
          <div className="space-y-2">
            {pendingMembers.map(m => (
              <div key={m.user_id} className="flex items-center gap-2 bg-white rounded-lg p-2">
                <Link to={`/profile/${m.user_id}`}>
                  <Avatar className="w-8 h-8">
                    {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                    <AvatarFallback style={{ background: "#1E3A5F", color: "#fff", fontSize: 10 }}>
                      {(m.profile?.display_name || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <span className="flex-1 truncate" style={{ fontSize: 13, fontWeight: 500, color: "#1E3A5F" }}>
                  {m.profile?.display_name || "Kullanıcı"}
                </span>
                <Button size="sm" variant="ghost" onClick={() => handleRequest(m.user_id, "accept")} style={{ color: "#16A34A", padding: "4px 8px" }}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Kabul
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleRequest(m.user_id, "reject")} style={{ color: "#E74C3C", padding: "4px 8px" }}>
                  <XCircle className="w-4 h-4 mr-1" /> Reddet
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="feed">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="feed" style={{ fontSize: 13 }}>{t("groups.feed_tab", "Feed")}</TabsTrigger>
          <TabsTrigger value="members" style={{ fontSize: 13 }}>{t("groups.tab.members", "Members")} ({activeMembers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          {isMember && (
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="w-full mb-4 gap-2" style={{ background: "#1E3A5F", color: "#fff", fontSize: 13 }}>
                  <Plus className="w-4 h-4" /> {t("groups.post_to_group", "Post to Group")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle style={{ fontSize: 15 }}>{group.name} grubuna paylaş</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Textarea placeholder="Aklından ne geçiyor?" className="resize-none" rows={4} value={postContent} onChange={e => setPostContent(e.target.value)} style={{ fontSize: 13 }} />
                  <MediaUpload value={postPhotos} onChange={setPostPhotos} maxFiles={6} />
                  <Button className="w-full" disabled={(!postContent.trim() && postPhotos.length === 0) || postMutation.isPending} onClick={() => postMutation.mutate()} style={{ background: "#E74C3C", color: "#fff" }}>
                    Paylaş
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#94A3B8" }}>
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p style={{ fontSize: 13 }}>{t("groups.empty_feed", "Henüz gönderi yok. İlk gönderiyi paylaş!")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="rounded-xl" style={{ border: "1px solid #E2EBFC", padding: 12 }}>
                  <div className="flex items-center gap-2 mb-2">
                    {post.user_id && <UserName userId={post.user_id} showAvatar />}
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{timeAgo(post.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#1E3A5F", lineHeight: 1.5 }}>{post.content}</p>
                  {post.photos && post.photos.length > 0 && (
                    <div className="mt-2"><MediaGrid urls={post.photos} /></div>
                  )}
                  <div className="flex items-center gap-4 pt-2 mt-2" style={{ borderTop: "1px solid #F1F5F9" }}>
                    <LikeButton entityType="wall_post" entityId={post.id} />
                    <CommentsSection entityType="wall_post" entityId={post.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members">
          <div className="space-y-2">
            {activeMembers.map(member => (
              <div key={member.user_id} className="flex items-center gap-3 rounded-lg p-3" style={{ border: "1px solid #E2EBFC" }}>
                <Link to={`/profile/${member.user_id}`}>
                  <Avatar className="w-10 h-10">
                    {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} />}
                    <AvatarFallback style={{ background: "#1E3A5F", color: "#fff", fontSize: 12 }}>
                      {(member.profile?.display_name || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${member.user_id}`} className="truncate block" style={{ fontSize: 13, fontWeight: 500, color: "#1E3A5F" }}>
                    {member.profile?.display_name || "Kullanıcı"}
                  </Link>
                </div>
                {(member.role === "owner" || member.role === "admin") && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: "#EFF4FF", color: "#1E3A5F" }}>
                    {member.role === "owner" ? `👑 ${t("groups.admin", "Admin")}` : "Mod"}
                  </span>
                )}
                {user && member.user_id !== user.id && (
                  <button onClick={() => handleMessage(member.user_id)} style={{ color: "#94A3B8" }}>
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupDetail;
