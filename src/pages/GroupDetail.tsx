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
import { Users, ArrowLeft, Plus, MessageSquare, Share2 } from "lucide-react";
import { LikeButton } from "@/components/social/LikeButton";
import { CommentsSection } from "@/components/shared/CommentsSection";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { MediaGrid } from "@/components/shared/MediaGrid";
import { UserName } from "@/components/shared/UserName";

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postOpen, setPostOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postPhotos, setPostPhotos] = useState<string[]>([]);

  const { data: group } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: membership } = useQuery({
    queryKey: ["group-membership", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const isMember = membership?.role === "member" || membership?.role === "owner" || membership?.role === "admin";

  const { data: posts = [] } = useQuery({
    queryKey: ["group-posts", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wall_posts")
        .select("id, content, photos, user_id, created_at, status")
        .eq("group_id", id!)
        .or("status.eq.active,status.is.null")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["group-members", id],
    queryFn: async () => {
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("user_id, role")
        .eq("group_id", id!);
      if (!memberRows?.length) return [];
      const userIds = memberRows.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      return memberRows.map((m) => ({
        ...m,
        profile: profiles?.find((p) => p.user_id === m.user_id),
      }));
    },
    enabled: !!id,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!user || (!postContent.trim() && postPhotos.length === 0)) return;
      const { error } = await supabase.from("wall_posts").insert({
        content: postContent.trim(),
        user_id: user.id,
        group_id: id!,
        photos: postPhotos.length > 0 ? postPhotos : [],
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPostContent("");
      setPostPhotos([]);
      setPostOpen(false);
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
      const { error } = await supabase.from("group_members").insert({
        group_id: id!,
        user_id: user.id,
        role,
      });
      if (error) throw error;
      if (role === "member") {
        await supabase.from("groups").update({ member_count: (group.member_count || 0) + 1 }).eq("id", id!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-membership", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      toast({ title: t("groups.toast.joined", "You joined the group") });
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
      queryClient.invalidateQueries({ queryKey: ["group-membership", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      toast({ title: t("groups.toast.left", "You left the group") });
    },
  });

  const handleMessage = async (targetUserId: string) => {
    if (!user) { navigate("/auth"); return; }
    const { data: myConvos } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    if (myConvos?.length) {
      const convIds = myConvos.map((c) => c.conversation_id);
      const { data: theirConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUserId)
        .in("conversation_id", convIds);
      if (theirConvos?.length) {
        navigate(`/messages?conversation=${theirConvos[0].conversation_id}`);
        return;
      }
    }
    const { data: conv } = await supabase.from("conversations").insert({ type: "dm" }).select("id").single();
    if (conv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: targetUserId },
      ]);
      navigate(`/messages?conversation=${conv.id}`);
    }
  };

  if (!group) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => navigate("/groups")}>
            <ArrowLeft className="w-4 h-4" /> {t("common.back", "Back")}
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
                  {group.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline">{group.category}</Badge>
                    <span className="text-sm text-muted-foreground">{group.member_count} {t("groups.members", "members")}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!user ? (
                <Button className="w-full" onClick={() => navigate("/auth")}>{t("groups.action.join", "Join Group")}</Button>
              ) : isMember ? (
                <Button variant="secondary" className="w-full" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending || membership?.role === "owner"}>
                  {membership?.role === "owner" ? t("groups.action.owner", "Owner") : t("groups.action.leave", "Leave Group")}
                </Button>
              ) : membership?.role === "pending" ? (
                <Button variant="secondary" className="w-full" disabled>{t("groups.action.requested", "Requested")}</Button>
              ) : (
                <Button className="w-full" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                  {t("groups.action.join", "Join Group")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="feed">
            <TabsList className="w-full">
              <TabsTrigger value="feed" className="flex-1">{t("groups.tab.feed", "Feed")}</TabsTrigger>
              <TabsTrigger value="members" className="flex-1">{t("groups.tab.members", "Members")}</TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              {isMember && (
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full mb-4 gap-2"><Plus className="w-4 h-4" /> {t("groups.post_to_group", "Post to Group")}</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t("groups.new_post_in", "New post in")} {group.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Textarea
                        placeholder={t("wall.whats_on_mind", "What's on your mind?")}
                        className="resize-none"
                        rows={4}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                      />
                      <MediaUpload value={postPhotos} onChange={setPostPhotos} maxFiles={6} />
                      <Button
                        className="w-full"
                        disabled={(!postContent.trim() && postPhotos.length === 0) || postMutation.isPending}
                        onClick={() => postMutation.mutate()}
                      >
                        {t("wall.post_btn", "Post")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t("groups.empty_feed", "Be the first to post in this group")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {post.user_id && <UserName userId={post.user_id} showAvatar />}
                          <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                        </div>
                        <p className="text-foreground mt-2">{post.content}</p>
                      </CardHeader>
                      {post.photos && post.photos.length > 0 && (
                        <div className="px-6 pb-2"><MediaGrid urls={post.photos} /></div>
                      )}
                      <CardContent>
                        <div className="flex items-center gap-4 pt-2 border-t border-border">
                          <LikeButton entityType="wall_post" entityId={post.id} />
                          <CommentsSection entityType="wall_post" entityId={post.id} />
                          <Button variant="ghost" size="sm" className="gap-1"><Share2 className="w-4 h-4" /> {t("wall.share", "Share")}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members">
              <div className="space-y-3">
                {members.map((member) => (
                  <Card key={member.user_id}>
                    <CardContent className="flex items-center gap-3 py-4">
                      <Link to={`/profile/${member.user_id}`}>
                        <Avatar className="w-10 h-10">
                          {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} />}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(member.profile?.display_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${member.user_id}`} className="font-medium text-foreground hover:underline truncate block">
                          {member.profile?.display_name || "User"}
                        </Link>
                      </div>
                      <Badge variant={member.role === "owner" || member.role === "admin" ? "default" : "secondary"}>
                        {member.role}
                      </Badge>
                      {user && member.user_id !== user.id && (
                        <Button variant="outline" size="sm" onClick={() => handleMessage(member.user_id)}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
