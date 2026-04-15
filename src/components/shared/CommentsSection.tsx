import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserName } from "@/components/shared/UserName";

interface CommentsProps {
  entityType: string;
  entityId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export function CommentsSection({ entityType, entityId }: CommentsProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], refetch } = useQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!data) return [];

      // Hydrate profiles
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      return data.map((c) => ({
        ...c,
        profile: profileMap.get(c.user_id) || null,
      })) as Comment[];
    },
    enabled: showComments,
  });

  // Realtime subscription
  useEffect(() => {
    if (!showComments) return;
    const channel = supabase
      .channel(`comments-${entityType}-${entityId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `entity_id=eq.${entityId}`,
      }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showComments, entityType, entityId, refetch]);

  const { data: commentCount = 0 } = useQuery({
    queryKey: ["comment-count", entityType, entityId],
    queryFn: async () => {
      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
      return count || 0;
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) { navigate("/auth"); return; }
      if (!newComment.trim()) return;
      const { error } = await supabase.from("comments").insert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
        content: newComment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["comment-count", entityType, entityId] });
    },
    onError: () => toast({ title: "Error posting comment", variant: "destructive" }),
  });

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="w-4 h-4" />
        {commentCount > 0 ? commentCount : "Comment"}
      </Button>

      {showComments && (
        <div className="mt-3 border-t border-border pt-3 space-y-3">
          {/* Comment input */}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addComment.mutate()}
            />
            <Button size="icon" onClick={() => addComment.mutate()} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Comments list */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={comment.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    {(comment.profile?.display_name || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <UserName userId={comment.user_id} className="text-xs" />
                    <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
