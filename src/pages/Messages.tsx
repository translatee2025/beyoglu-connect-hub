import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, MessageSquare, Search } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get("conv");
  const [message, setMessage] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  // Conversations list
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user!.id);

      if (!participations?.length) return [];

      const convIds = participations.map((p) => p.conversation_id);
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convIds)
        .order("updated_at", { ascending: false });

      // Get other participants' profiles
      const result = await Promise.all(
        (convs || []).map(async (conv) => {
          const { data: parts } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id)
            .neq("user_id", user!.id);

          const otherUserId = parts?.[0]?.user_id;
          let otherProfile = null;
          if (otherUserId) {
            const { data } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", otherUserId)
              .maybeSingle();
            otherProfile = data;
          }

          // Last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...conv,
            otherUserId,
            otherName: otherProfile?.display_name || "User",
            lastMessage: lastMsg?.[0]?.content || "",
            lastMessageAt: lastMsg?.[0]?.created_at || conv.updated_at,
          };
        })
      );

      return result;
    },
    enabled: !!user,
  });

  // Messages for active conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeConvId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConvId!)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!activeConvId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`messages-${activeConvId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
        queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConvId, queryClient, user?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !activeConvId || !user) return;
      await supabase.from("messages").insert({
        conversation_id: activeConvId,
        sender_id: user.id,
        content: message.trim(),
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
    },
  });

  // Search users for new conversation
  const { data: searchResults = [] } = useQuery({
    queryKey: ["search-users", searchUser],
    queryFn: async () => {
      if (searchUser.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${searchUser}%`)
        .neq("user_id", user!.id)
        .limit(10);
      return data || [];
    },
    enabled: searchUser.length >= 2 && !!user,
  });

  const startNewConversation = async (otherUserId: string) => {
    if (!user) return;
    // Check existing
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    if (myConvs?.length) {
      const { data: shared } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", myConvs.map((c) => c.conversation_id));
      if (shared?.length) {
        setSearchParams({ conv: shared[0].conversation_id });
        setShowNewChat(false);
        return;
      }
    }
    const { data: conv } = await supabase.from("conversations").insert({}).select().single();
    if (conv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);
      setSearchParams({ conv: conv.id });
      setShowNewChat(false);
      queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 h-[calc(100vh-8rem)]">
            {/* Conversation list */}
            <div className={`${activeConvId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 flex-shrink-0`}>
              <div className="flex items-center justify-between mb-3">
                <h1 className="font-display font-bold text-xl text-foreground">Messages</h1>
                <Button size="sm" variant="outline" onClick={() => setShowNewChat(!showNewChat)}>
                  New Chat
                </Button>
              </div>

              {showNewChat && (
                <Card className="p-3 mb-3">
                  <Input
                    placeholder="Search users..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="mb-2"
                  />
                  {searchResults.map((u) => (
                    <button
                      key={u.user_id}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-left"
                      onClick={() => startNewConversation(u.user_id)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {(u.display_name || "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{u.display_name || "User"}</span>
                    </button>
                  ))}
                </Card>
              )}

              <div className="flex-1 overflow-y-auto space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSearchParams({ conv: conv.id })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeConvId === conv.id ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conv.otherName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm text-foreground truncate">{conv.otherName}</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(conv.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message thread */}
            <div className={`${activeConvId ? "flex" : "hidden md:flex"} flex-col flex-1 bg-card rounded-xl border border-border`}>
              {activeConvId && activeConv ? (
                <>
                  {/* Thread header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <button className="md:hidden" onClick={() => setSearchParams({})}>
                      <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {activeConv.otherName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="font-medium text-foreground cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${activeConv.otherUserId}`)}
                    >
                      {activeConv.otherName}
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}>
                            {msg.content}
                            <div className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-border">
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage.mutate();
                      }}
                    >
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" disabled={!message.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Select a conversation or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
