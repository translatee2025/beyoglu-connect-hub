import { useState } from "react";
import { MessageSquare, Share2, Home, Car, Dog, Store, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { LikeButton } from "@/components/social/LikeButton";
import { type EntityType } from "@/hooks/useLikes";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { MediaGrid } from "@/components/shared/MediaGrid";

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
};

const Wall = () => {
  const [newPost, setNewPost] = useState("");
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wall posts
  const { data: wallPosts = [] } = useQuery({
    queryKey: ["wall-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("wall_posts").select("id, content, photos, user_id, created_at").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "wall", title: item.content?.slice(0, 80), description: item.content?.length > 80 ? item.content : undefined,
        photos: item.photos || [], created_at: item.created_at, badge: "Post", icon: MessageSquare, entityType: "wall_post" as EntityType,
      }));
    },
  });

  const { data: classifieds = [] } = useQuery({
    queryKey: ["wall-classifieds"],
    queryFn: async () => {
      const { data } = await supabase.from("classifieds").select("id, title, description, section, created_at").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "classifieds", title: item.title, description: item.description, created_at: item.created_at,
        badge: item.section === "rental" ? "Rental" : item.section === "parking" ? "Parking" : "Classified",
        icon: item.section === "rental" ? Home : item.section === "parking" ? Car : Store, entityType: "classified" as EntityType,
      }));
    },
  });

  const { data: petPosts = [] } = useQuery({
    queryKey: ["wall-pets"],
    queryFn: async () => {
      const { data } = await supabase.from("pet_posts").select("id, title, description, post_type, created_at").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "pets", title: item.title, description: item.description, created_at: item.created_at,
        badge: "Pets", icon: Dog, entityType: "pet_post" as EntityType,
      }));
    },
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["wall-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("id, name, description, created_at").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "venues", title: item.name, description: item.description, created_at: item.created_at,
        badge: "Venue", icon: Store, entityType: "venue" as EntityType,
      }));
    },
  });

  const { data: helpPosts = [] } = useQuery({
    queryKey: ["wall-help"],
    queryFn: async () => {
      const { data } = await supabase.from("neighbor_help_posts").select("id, title, description, help_type, created_at").order("created_at", { ascending: false }).limit(20);
      return (data || []).map((item: any) => ({
        id: item.id, source: "help", title: item.title, description: item.description, created_at: item.created_at,
        badge: item.help_type === "offer" ? "Help Offer" : "Help Wanted", icon: Wrench, entityType: "help_post" as EntityType,
      }));
    },
  });

  const postToWall = useMutation({
    mutationFn: async () => {
      if (!user || (!newPost.trim() && newPhotos.length === 0)) return;
      await supabase.from("wall_posts").insert({ content: newPost.trim(), user_id: user.id, photos: newPhotos.length > 0 ? newPhotos : [] });
    },
    onSuccess: () => {
      setNewPost("");
      setNewPhotos([]);
      queryClient.invalidateQueries({ queryKey: ["wall-posts"] });
    },
  });

  const allItems: FeedItem[] = [...wallPosts, ...classifieds, ...petPosts, ...venues, ...helpPosts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const badgeColor = (badge: string) => {
    if (badge === "Rental") return "default";
    if (badge === "Parking") return "secondary";
    if (badge === "Pets") return "outline";
    if (badge === "Venue") return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">Community Wall</h1>
            <p className="text-muted-foreground">See what's happening in your neighborhood</p>
          </div>

          {/* Create Post */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">You</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share something with your community..."
                    className="resize-none"
                    rows={3}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                  />
                  <MediaUpload value={newPhotos} onChange={setNewPhotos} maxFiles={6} />
                  <Button disabled={(!newPost.trim() && newPhotos.length === 0) || !user} onClick={() => { if (!user) navigate("/auth"); else postToWall.mutate(); }}>Post</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feed */}
          {allItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No activity yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={`${item.source}-${item.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={badgeColor(item.badge) as any}>{item.badge}</Badge>
                            <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
                          </div>
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 pt-2 border-t border-border">
                        <LikeButton entityType={item.entityType} entityId={item.id} />
                        <Button variant="ghost" size="sm" className="gap-1">
                          <MessageSquare className="w-4 h-4" /> Comment
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Share2 className="w-4 h-4" /> Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wall;
