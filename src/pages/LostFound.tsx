import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Plus, MapPin, Clock, MessageCircle, CheckCircle, ImagePlus,
  X, Loader2, CalendarIcon, Search as SearchIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Keys", "Wallet", "Phone", "Documents", "Bag", "Pet", "Jewelry", "Electronics", "Other"];

const useTimeAgo = () => {
  const { t } = useLanguage();
  return (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("time.just_now", "just now");
    if (mins < 60) return `${mins} ${t("time.minutes_ago", "m ago")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t("time.hours_ago", "h ago")}`;
    const days = Math.floor(hrs / 24);
    return `${days} ${t("time.days_ago", "d ago")}`;
  };
};

// ─── Photo Upload (to lost-found bucket) ───

function LostFoundPhotoUpload({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = 5 - value.length;
    if (remaining <= 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (file.size > 20 * 1024 * 1024) { toast({ title: "File too large (max 20MB)", variant: "destructive" }); continue; }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("lost-found").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast({ title: "Upload failed", variant: "destructive" }); continue; }
      const { data } = supabase.storage.from("lost-found").getPublicUrl(path);
      if (data?.publicUrl) newUrls.push(data.publicUrl);
    }
    if (newUrls.length) onChange([...value, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < 5 && (
        <>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <Button type="button" variant="outline" size="sm" className="gap-2 w-full border-dashed" disabled={uploading || !user} onClick={() => inputRef.current?.click()}>
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("common.uploading", "Uploading...")}</> : <><ImagePlus className="w-4 h-4" /> {t("common.add_photos", "Add Photos")}</>}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Report Form ───

function ReportForm({ type, onSuccess }: { type: "lost" | "found"; onSuccess: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "", description: "", neighborhood: "",
    phone: "", contact_preference: "chat", photo_urls: [] as string[],
  });
  const [lastSeenAt, setLastSeenAt] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("lost_found_posts").insert({
        user_id: user.id,
        type,
        status: "active",
        title: form.title.trim(),
        category: form.category || "Other",
        description: form.description || null,
        neighborhood: form.neighborhood || null,
        last_seen_at: lastSeenAt ? lastSeenAt.toISOString() : null,
        phone: form.phone || null,
        contact_preference: form.contact_preference,
        photo_urls: form.photo_urls.length > 0 ? form.photo_urls : [],
      });
      if (error) throw error;
      toast({ title: type === "lost" ? "Lost item reported!" : "Found item reported!" });
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Title *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={type === "lost" ? "e.g. Black leather wallet" : "I found a..."}
          required
        />
      </div>
      <div>
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the item..." />
      </div>
      <div>
        <Label>Neighborhood</Label>
        <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Where was it lost/found?" />
      </div>
      <div>
        <Label>Last seen date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !lastSeenAt && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {lastSeenAt ? format(lastSeenAt, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={lastSeenAt} onSelect={setLastSeenAt} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label>Phone (optional)</Label>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90..." />
      </div>
      <div>
        <Label>Contact preference</Label>
        <Select value={form.contact_preference} onValueChange={(v) => setForm({ ...form, contact_preference: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Photos</Label>
        <LostFoundPhotoUpload value={form.photo_urls} onChange={(urls) => setForm({ ...form, photo_urls: urls })} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t("common.submitting", "Submitting...") : type === "lost" ? t("lostfound.report_lost", "Report Lost Item") : t("lostfound.report_found", "Report Found Item")}
      </Button>
    </form>
  );
}

// ─── Post Card ───

function PostCard({ post, isOwner }: { post: any; isOwner: boolean }) {
  const timeAgo = useTimeAgo();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const resolvePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("lost_found_posts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() } as any)
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Marked as resolved!" });
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
    },
  });

  const handleContact = async () => {
    if (!user) { navigate("/auth"); return; }
    // Open or create DM conversation
    const myId = user.id;
    const otherId = post.user_id;
    if (myId === otherId) return;

    // Check existing conversation
    const { data: myParts } = await supabase
      .from("conversation_participants").select("conversation_id").eq("user_id", myId);
    const { data: theirParts } = await supabase
      .from("conversation_participants").select("conversation_id").eq("user_id", otherId);

    const myConvIds = new Set((myParts || []).map((p) => p.conversation_id));
    const sharedConv = (theirParts || []).find((p) => myConvIds.has(p.conversation_id));

    if (sharedConv) {
      navigate(`/messages?conv=${sharedConv.conversation_id}`);
    } else {
      const { data: conv } = await supabase.from("conversations").insert({ type: "dm", status: "accepted" }).select("id").single();
      if (conv) {
        await supabase.from("conversation_participants").insert([
          { conversation_id: conv.id, user_id: myId },
          { conversation_id: conv.id, user_id: otherId },
        ]);
        navigate(`/messages?conv=${conv.id}`);
      }
    }
  };

  const photo = post.photo_urls?.[0];

  return (
    <Card className="overflow-hidden">
      {photo ? (
        <div className="aspect-video bg-muted">
          <img src={photo} alt={post.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <SearchIcon className="w-10 h-10 text-muted-foreground/40" />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{post.title}</h3>
          <Badge variant="secondary" className="flex-shrink-0 text-[11px]">{post.category}</Badge>
        </div>
        {post.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{post.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {post.neighborhood && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.neighborhood}</span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(post.created_at)}</span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={handleContact}>
            <MessageCircle className="w-4 h-4" /> {t("common.contact", "Contact")}
          </Button>
          {isOwner && (
            <Button size="sm" variant="secondary" className="gap-1" onClick={() => resolvePost.mutate()} disabled={resolvePost.isPending}>
              <CheckCircle className="w-4 h-4" /> {t("common.mark_resolved", "Resolved")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───

const LostFound = () => {
  const [activeTab, setActiveTab] = useState("lost");
  const [showLostForm, setShowLostForm] = useState(false);
  const [showFoundForm, setShowFoundForm] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["lost-found", activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_found_posts")
        .select("*")
        .eq("type", activeTab)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("lostfound.title", "Lost & Found")}</h1>
          <p className="text-sm text-muted-foreground">{t("lostfound.subtitle", "Help your neighbors find what they've lost")}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showLostForm} onOpenChange={setShowLostForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1">
                <Plus className="w-4 h-4" /> {t("lostfound.report_lost_btn", "Report Lost")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("lostfound.report_lost", "Report Lost Item")}</DialogTitle></DialogHeader>
              <ReportForm type="lost" onSuccess={() => setShowLostForm(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={showFoundForm} onOpenChange={setShowFoundForm}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> {t("lostfound.report_found_btn", "Report Found")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("lostfound.report_found", "Report Found Item")}</DialogTitle></DialogHeader>
              <ReportForm type="found" onSuccess={() => setShowFoundForm(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="lost">{t("lostfound.tab_lost", "Lost")}</TabsTrigger>
          <TabsTrigger value="found">{t("lostfound.tab_found", "Found")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <SearchIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                {activeTab === "lost" ? t("lostfound.no_lost", "No lost items reported") : t("lostfound.no_found", "No found items reported")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === "lost"
                  ? t("lostfound.no_lost_hint", "Lost something? Click 'Report Lost' to alert your neighbors.")
                  : t("lostfound.no_found_hint", "Found something? Click 'Report Found' to help someone out.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isOwner={user?.id === post.user_id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LostFound;
