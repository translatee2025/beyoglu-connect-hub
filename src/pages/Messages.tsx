import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, MessageSquare, Trash2, Plus, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface ConvItem {
  id: string;
  otherUserId: string;
  otherName: string;
  lastMessage: string;
  lastMessageAt: string;
}

/* ─── Hooks ─── */
function useConversations(userId?: string) {
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId!);
      if (!participations?.length) return [] as ConvItem[];

      const convIds = participations.map((p) => p.conversation_id);
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .in("id", convIds)
        .order("updated_at", { ascending: false });

      const result = await Promise.all(
        (convs || []).map(async (conv) => {
          const { data: parts } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id)
            .neq("user_id", userId!);
          const otherUserId = parts?.[0]?.user_id || "";
          let otherName = "User";
          if (otherUserId) {
            const { data } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", otherUserId)
              .maybeSingle();
            otherName = data?.display_name || "User";
          }
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);
          return {
            id: conv.id,
            otherUserId,
            otherName,
            lastMessage: lastMsg?.[0]?.content || "",
            lastMessageAt: lastMsg?.[0]?.created_at || conv.updated_at,
          } as ConvItem;
        })
      );
      return result;
    },
    enabled: !!userId,
  });
}

function useMessages(convId: string | null) {
  return useQuery({
    queryKey: ["messages", convId],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId!)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!convId,
  });
}

/* ─── Helpers ─── */
const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

/* ─── Sub-components ─── */
const ConversationList = ({
  conversations,
  activeConvId,
  onSelect,
  onDelete,
  onNewChat,
}: {
  conversations: ConvItem[];
  activeConvId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between mb-3">
      <h1 className="font-display font-bold text-xl text-foreground">Messages</h1>
      <Button size="sm" variant="outline" onClick={onNewChat} className="gap-1">
        <Plus className="w-4 h-4" /> New
      </Button>
    </div>
    <div className="flex-1 overflow-y-auto space-y-1">
      {conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No conversations yet</p>
        </div>
      ) : (
        conversations.map((conv) => (
          <div key={conv.id} className={`group flex items-center rounded-lg transition-colors ${activeConvId === conv.id ? "bg-muted" : "hover:bg-muted/50"}`}>
            <button
              onClick={() => onSelect(conv.id)}
              className="flex-1 flex items-center gap-3 p-3 text-left min-w-0"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {conv.otherName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm text-foreground truncate">{conv.otherName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{timeAgo(conv.lastMessageAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-2 mr-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete this conversation and all messages.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(conv.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))
      )}
    </div>
  </div>
);

const NewChatSearch = ({
  onStart,
  userId,
}: {
  onStart: (otherUserId: string) => void;
  userId: string;
}) => {
  const [search, setSearch] = useState("");
  const { data: results = [] } = useQuery({
    queryKey: ["search-users", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${search}%`)
        .neq("user_id", userId)
        .limit(10);
      return data || [];
    },
    enabled: search.length >= 2,
  });

  return (
    <Card className="p-3 mb-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="mt-2 max-h-48 overflow-y-auto">
        {results.map((u) => (
          <button
            key={u.user_id}
            className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-left"
            onClick={() => onStart(u.user_id)}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {(u.display_name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{u.display_name || "User"}</span>
          </button>
        ))}
        {search.length >= 2 && results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No users found</p>
        )}
      </div>
    </Card>
  );
};

const ChatThread = ({
  conv,
  messages,
  userId,
  onBack,
  onSend,
  onNavigateProfile,
}: {
  conv: ConvItem;
  messages: any[];
  userId: string;
  onBack: () => void;
  onSend: (text: string) => void;
  onNavigateProfile: (id: string) => void;
}) => {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button className="md:hidden" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {conv.otherName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className="font-medium text-foreground cursor-pointer hover:underline"
          onClick={() => onNavigateProfile(conv.otherUserId)}
        >
          {conv.otherName}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.content}
                <div className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!text.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
};

/* ─── Main Page ─── */
const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get("conv");
  const [showNewChat, setShowNewChat] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  const { data: conversations = [] } = useConversations(user?.id);
  const { data: messages = [] } = useMessages(activeConvId);

  // Realtime
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

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConvId || !user) return;
      await supabase.from("messages").insert({
        conversation_id: activeConvId,
        sender_id: user.id,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (convId: string) => {
      await supabase.from("messages").delete().eq("conversation_id", convId);
      await supabase.from("conversation_participants").delete().eq("conversation_id", convId);
      await supabase.from("conversations").delete().eq("id", convId);
    },
    onSuccess: () => {
      if (activeConvId) setSearchParams({});
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      toast({ title: "Conversation deleted" });
    },
  });

  // Start new conversation
  const startNewConversation = async (otherUserId: string) => {
    if (!user) return;
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

  const activeConv = conversations.find((c) => c.id === activeConvId);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 h-[calc(100vh-8rem)]">
            {/* Sidebar */}
            <div className={`${activeConvId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 flex-shrink-0`}>
              {showNewChat && <NewChatSearch onStart={startNewConversation} userId={user.id} />}
              <ConversationList
                conversations={conversations}
                activeConvId={activeConvId}
                onSelect={(id) => setSearchParams({ conv: id })}
                onDelete={(id) => deleteConversation.mutate(id)}
                onNewChat={() => setShowNewChat(!showNewChat)}
              />
            </div>

            {/* Thread */}
            <div className={`${activeConvId ? "flex" : "hidden md:flex"} flex-col flex-1 bg-card rounded-xl border border-border`}>
              {activeConvId && activeConv ? (
                <ChatThread
                  conv={activeConv}
                  messages={messages}
                  userId={user.id}
                  onBack={() => setSearchParams({})}
                  onSend={(text) => sendMessage.mutate(text)}
                  onNavigateProfile={(id) => navigate(`/profile/${id}`)}
                />
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
