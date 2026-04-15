import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Edit2, Save, X, MapPin, Camera, Users, Bell, Activity, Flag } from "lucide-react";
import { FriendButton } from "@/components/social/FriendButton";
import { FriendsList } from "@/components/social/FriendsList";
import { FriendRequestsList } from "@/components/social/FriendRequestsList";
import { useToast } from "@/hooks/use-toast";
import { ReportDialog } from "@/components/shared/ReportDialog";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", neighborhood: "", phone: "" });
  const [uploading, setUploading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const isOwn = user?.id === userId;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId!).maybeSingle();
      if (data) setForm({ display_name: data.display_name || "", bio: data.bio || "", neighborhood: data.neighborhood || "", phone: data.phone || "" });
      return data;
    },
    enabled: !!userId,
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ["profile-activity", userId],
    queryFn: async () => {
      const items: any[] = [];
      const { data: wall } = await supabase.from("wall_posts").select("id, content, created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(5);
      (wall || []).forEach((p) => items.push({ ...p, type: "Wall Post", title: p.content?.slice(0, 60) }));
      const { data: classifieds } = await supabase.from("classifieds").select("id, title, created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(5);
      (classifieds || []).forEach((p) => items.push({ ...p, type: "Classified" }));
      const { data: help } = await supabase.from("neighbor_help_posts").select("id, title, created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(5);
      (help || []).forEach((p) => items.push({ ...p, type: "Help" }));
      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
    },
    enabled: !!userId,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ display_name: form.display_name, bio: form.bio, neighborhood: form.neighborhood, phone: form.phone }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile", userId] }); setEditing(false); toast({ title: t("profile.save", "Profile updated!") }); },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
    if (uploadError) { toast({ title: t("common.error", "Upload failed"), variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    toast({ title: t("profile.save", "Avatar updated!") });
    setUploading(false);
  };

  const startConversation = async () => {
    if (!user) { navigate("/auth"); return; }
    const { data: myConvs } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map((c) => c.conversation_id);
      const { data: shared } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", userId!).in("conversation_id", convIds);
      if (shared && shared.length > 0) { navigate(`/messages?conv=${shared[0].conversation_id}`); return; }
    }
    const { data: conv } = await supabase.from("conversations").insert({}).select().single();
    if (conv) {
      await supabase.from("conversation_participants").insert([{ conversation_id: conv.id, user_id: user.id }, { conversation_id: conv.id, user_id: userId! }]);
      navigate(`/messages?conv=${conv.id}`);
    }
  };

  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();
  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground">{t("common.loading", "Loading...")}</div>;
  if (!profile) return <div className="flex justify-center py-20 text-muted-foreground">{t("profile.user_not_found", "User not found")}</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="relative inline-block mx-auto mb-3">
              <Avatar className="w-24 h-24"><AvatarImage src={profile.avatar_url || undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-3xl">{initials}</AvatarFallback></Avatar>
              {isOwn && (
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </label>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder={t("profile.display_name", "Display name")} />
                <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder={t("profile.neighborhood", "Neighborhood")} />
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("profile.phone", "Phone number")} />
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder={t("profile.bio", "Tell us about yourself...")} rows={3} />
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => updateProfile.mutate()}><Save className="w-4 h-4 mr-1" /> {t("profile.save", "Save")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1" /> {t("profile.cancel", "Cancel")}</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-foreground">{profile.display_name || t("profile.anonymous", "Anonymous")}</h1>
                {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                {profile.neighborhood && <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mt-1"><MapPin className="w-3 h-3" /> {profile.neighborhood}</div>}
                {profile.bio && <p className="text-muted-foreground mt-2">{profile.bio}</p>}
                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                  {isOwn && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4 mr-1" /> {t("profile.edit", "Edit Profile")}</Button>}
                  {!isOwn && user && (
                    <>
                      <FriendButton targetUserId={userId!} />
                      <Button size="sm" variant="outline" onClick={startConversation}><MessageSquare className="w-4 h-4 mr-1" /> {t("profile.message", "Message")}</Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setReportOpen(true)}><Flag className="w-4 h-4 mr-1" /> Report</Button>
                    </>
                  )}
                </div>
              </>
            )}
          </CardHeader>
        </Card>
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className={`w-full ${isOwn ? 'grid-cols-3' : 'grid-cols-1'} grid`}>
            <TabsTrigger value="activity" className="gap-1"><Activity className="w-4 h-4" /> {t("profile.activity", "Activity")}</TabsTrigger>
            {isOwn && (
              <>
                <TabsTrigger value="friends" className="gap-1"><Users className="w-4 h-4" /> {t("profile.friends", "Friends")}</TabsTrigger>
                <TabsTrigger value="requests" className="gap-1"><Bell className="w-4 h-4" /> {t("profile.requests", "Requests")}</TabsTrigger>
              </>
            )}
          </TabsList>
          <TabsContent value="activity">
            {recentPosts.length === 0 ? <p className="text-muted-foreground text-center py-8">{t("profile.no_activity", "No activity yet")}</p> : (
              <div className="space-y-3">{recentPosts.map((post) => (
                <Card key={post.id}><CardContent className="py-3 px-4 flex items-center gap-3"><Badge variant="secondary" className="text-xs">{post.type}</Badge><span className="text-sm text-foreground truncate flex-1">{post.title}</span><span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(post.created_at).toLocaleDateString()}</span></CardContent></Card>
              ))}</div>
            )}
          </TabsContent>
          {isOwn && (<><TabsContent value="friends"><FriendsList /></TabsContent><TabsContent value="requests"><FriendRequestsList /></TabsContent></>)}
        </Tabs>
      </div>
      {userId && !isOwn && (
        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} contentType="user" contentId={userId} />
      )}
    </div>
  );
};

export default Profile;
