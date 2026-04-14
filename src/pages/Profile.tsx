import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Edit2, Save, X, MapPin } from "lucide-react";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", neighborhood: "" });

  const isOwn = user?.id === userId;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (data) {
        setForm({ display_name: data.display_name || "", bio: data.bio || "", neighborhood: data.neighborhood || "" });
      }
      return data;
    },
    enabled: !!userId,
  });

  // Recent activity
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
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: form.display_name, bio: form.bio, neighborhood: form.neighborhood })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setEditing(false);
    },
  });

  const startConversation = async () => {
    if (!user) { navigate("/auth"); return; }
    // Check existing conversation
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map((c) => c.conversation_id);
      const { data: shared } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId!)
        .in("conversation_id", convIds);

      if (shared && shared.length > 0) {
        navigate(`/messages?conv=${shared[0].conversation_id}`);
        return;
      }
    }

    // Create new conversation
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

  if (isLoading) return <div className="flex justify-center py-20 text-muted-foreground">Loading...</div>;
  if (!profile) return <div className="flex justify-center py-20 text-muted-foreground">User not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-3">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
            </Avatar>

            {editing ? (
              <div className="space-y-3">
                <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Display name" />
                <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Neighborhood" />
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} />
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => updateProfile.mutate()}><Save className="w-4 h-4 mr-1" /> Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-foreground">{profile.display_name || "Anonymous"}</h1>
                {profile.neighborhood && (
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="w-3 h-3" /> {profile.neighborhood}
                  </div>
                )}
                {profile.bio && <p className="text-muted-foreground mt-2">{profile.bio}</p>}
                <div className="flex justify-center gap-2 mt-4">
                  {isOwn && (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
                    </Button>
                  )}
                  {!isOwn && user && (
                    <Button size="sm" onClick={startConversation}>
                      <MessageSquare className="w-4 h-4 mr-1" /> Message
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardHeader>
        </Card>

        {/* Recent Activity */}
        <h2 className="font-display font-bold text-lg mt-8 mb-4 text-foreground">Recent Activity</h2>
        {recentPosts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">{post.type}</Badge>
                  <span className="text-sm text-foreground truncate flex-1">{post.title}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
