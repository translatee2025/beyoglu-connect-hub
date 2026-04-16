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
  X, Loader2, CalendarIcon, List, Map as MapIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ANIMAL_EMOJI: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🐦", pet: "🐾", other: "🐾",
  Keys: "🔑", Wallet: "👛", Phone: "📱", Documents: "📄",
  Bag: "👜", Jewelry: "💍", Electronics: "💻", Other: "🐾",
};

const getAnimalEmoji = (category: string) => ANIMAL_EMOJI[category?.toLowerCase()] || ANIMAL_EMOJI[category] || "🐾";

const PIN_COLORS: Record<string, string> = {
  dog: "#F97316", cat: "#3B82F6", bird: "#22C55E",
};
const getColor = (cat: string) => PIN_COLORS[cat?.toLowerCase()] || "#94A3B8";

function createColoredIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

// ─── Photo Upload ───
function LostFoundPhotoUpload({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = 5 - value.length;
    if (remaining <= 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (file.size > 20 * 1024 * 1024) continue;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("lost-found").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) continue;
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
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("lost_found.uploading", "Uploading...")}</> : <><ImagePlus className="w-4 h-4" /> {t("lost_found.add_photo", "Add Photo")}</>}
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
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const CATEGORIES = ["Pet", "Keys", "Wallet", "Phone", "Documents", "Bag", "Jewelry", "Electronics", "Other"];
  const [form, setForm] = useState({
    title: "", category: "", description: "", neighborhood: "",
    phone: "", contact_preference: "chat", photo_urls: [] as string[],
  });
  const [lastSeenAt, setLastSeenAt] = useState<Date | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    if (!form.title.trim()) { toast({ title: t("common.title_required", "Title required"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("lost_found_posts").insert({
        user_id: user.id, type, status: "active",
        title: form.title.trim(), category: form.category || "Other",
        description: form.description || null, neighborhood: form.neighborhood || null,
        last_seen_at: lastSeenAt ? lastSeenAt.toISOString() : null,
        phone: form.phone || null, contact_preference: form.contact_preference,
        photo_urls: form.photo_urls.length > 0 ? form.photo_urls : [],
      });
      if (error) throw error;
      toast({ title: type === "lost" ? t("lost_found.lost_created", "Lost report created") : t("lost_found.found_created", "Found report created") });
      queryClient.invalidateQueries({ queryKey: ["lost-found"] });
      onSuccess();
    } catch (err: any) {
      toast({ title: t("common.error", "Error"), description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div><Label>{t("lost_found.title_required", "Title *")}</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={type === "lost" ? t("lost_found.lost_placeholder", "e.g. Black cat") : t("lost_found.found_placeholder", "I found...")} required /></div>
      <div><Label>{t("lost_found.category", "Category")}</Label>
        <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
          <SelectTrigger><SelectValue placeholder={t("lost_found.select_category", "Select category")} /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>{t("lost_found.description", "Description")}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
      <div><Label>{t("lost_found.location", "Location")}</Label><Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder={t("lost_found.location_placeholder", "Where was it lost/found?")} /></div>
      <div><Label>{t("lost_found.last_seen", "Last seen date")}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !lastSeenAt && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />{lastSeenAt ? format(lastSeenAt, "PPP") : t("lost_found.select_date", "Select date")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={lastSeenAt} onSelect={setLastSeenAt} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
        </Popover>
      </div>
      <div><Label>{t("lost_found.phone_optional", "Phone (optional)")}</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+90..." /></div>
      <div><Label>{t("lost_found.photos", "Photos")}</Label><LostFoundPhotoUpload value={form.photo_urls} onChange={urls => setForm({ ...form, photo_urls: urls })} /></div>
      <Button type="submit" disabled={loading} className="w-full">{loading ? t("common.sending", "Sending...") : type === "lost" ? t("lost_found.report_lost", "Report Lost") : t("lost_found.report_found", "Report Found")}</Button>
    </form>
  );
}

// ─── Post Card ───
function PostCard({ post, isOwner }: { post: any; isOwner: boolean }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("time.just_now", "just now");
    if (mins < 60) return `${mins}${t("time.min_ago", "m").replace("{n}", "")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t("time.hours_short", "h").replace("{n}", "")}`;
    const days = Math.floor(hrs / 24);
    return `${days}${t("time.days_short", "d").replace("{n}", "")}`;
  };

  const resolvePost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lost_found_posts").update({ status: "resolved", resolved_at: new Date().toISOString() } as any).eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("lost_found.resolved_marked", "Marked as resolved!") }); queryClient.invalidateQueries({ queryKey: ["lost-found"] }); },
  });

  const handleContact = async () => {
    if (!user) { navigate("/auth"); return; }
    const myId = user.id;
    const otherId = post.user_id;
    if (myId === otherId) return;
    const { data: myParts } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", myId);
    const { data: theirParts } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", otherId);
    const myConvIds = new Set((myParts || []).map(p => p.conversation_id));
    const sharedConv = (theirParts || []).find(p => myConvIds.has(p.conversation_id));
    if (sharedConv) { navigate(`/messages?conv=${sharedConv.conversation_id}`); return; }
    const { data: conv } = await supabase.from("conversations").insert({ type: "dm", status: "accepted" }).select("id").single();
    if (conv) {
      await supabase.from("conversation_participants").insert([{ conversation_id: conv.id, user_id: myId }, { conversation_id: conv.id, user_id: otherId }]);
      navigate(`/messages?conv=${conv.id}`);
    }
  };

  const photo = post.photo_urls?.[0];
  const emoji = getAnimalEmoji(post.category);

  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <div style={{ height: 140, position: "relative" }} className="bg-muted">
        {photo ? (
          <img src={photo} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#EFF4FF" }}>
            <span style={{ fontSize: 32 }}>{emoji}</span>
          </div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8, background: "#1E3A5F", color: "#fff", fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: "0 0 6px 0" }}>
          {post.type === "lost" ? t("lost_found.lost_label", "🔴 Lost") : t("lost_found.found_label", "🟢 Found")}
        </div>
      </div>
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <h3 className="flex-1 truncate" style={{ fontSize: 14, fontWeight: 600, color: "#1E3A5F" }}>{post.title}</h3>
        </div>
        {post.neighborhood && (
          <div className="flex items-center gap-1" style={{ fontSize: 12, color: "#94A3B8" }}>
            <MapPin className="w-3 h-3" /> {post.neighborhood}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#94A3B8" }}>{timeAgo(post.created_at)}</div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1 gap-1" onClick={handleContact} style={{ background: "#E74C3C", color: "#fff", border: "none", fontSize: 12, borderRadius: 6 }}>
            <MessageCircle className="w-3.5 h-3.5" /> {t("lost_found.contact", "Contact")}
          </Button>
          {isOwner && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => resolvePost.mutate()} disabled={resolvePost.isPending} style={{ fontSize: 12, borderRadius: 6 }}>
              <CheckCircle className="w-3.5 h-3.5" /> {t("lost_found.resolved", "Resolved")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Map View ───
function LostFoundMap({ posts }: { posts: any[] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const postsWithCoords = posts.filter(p => p.last_seen_lat && p.last_seen_lng);

  const handleContact = async (post: any) => {
    if (!user) { navigate("/auth"); return; }
    const myId = user.id;
    const otherId = post.user_id;
    if (myId === otherId) return;
    const { data: myParts } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", myId);
    const { data: theirParts } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", otherId);
    const myConvIds = new Set((myParts || []).map(p => p.conversation_id));
    const sharedConv = (theirParts || []).find(p => myConvIds.has(p.conversation_id));
    if (sharedConv) { navigate(`/messages?conv=${sharedConv.conversation_id}`); return; }
    const { data: conv } = await supabase.from("conversations").insert({ type: "dm", status: "accepted" }).select("id").single();
    if (conv) {
      await supabase.from("conversation_participants").insert([{ conversation_id: conv.id, user_id: myId }, { conversation_id: conv.id, user_id: otherId }]);
      navigate(`/messages?conv=${conv.id}`);
    }
  };

  return (
    <div style={{ height: 400, borderRadius: 12, overflow: "hidden" }}>
      <MapContainer center={[41.0330, 28.9815]} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {postsWithCoords.map(post => (
          <Marker key={post.id} position={[post.last_seen_lat, post.last_seen_lng]} icon={createColoredIcon(getColor(post.category))}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div className="flex gap-2 mb-2">
                  {post.photo_urls?.[0] ? (
                    <img src={post.photo_urls[0]} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: "#EFF4FF", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                      {getAnimalEmoji(post.category)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F" }}>{post.title}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(post.created_at).toLocaleDateString("tr-TR")}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleContact(post)}
                  style={{ width: "100%", background: "#E74C3C", color: "#fff", border: "none", borderRadius: 6, padding: "5px 0", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                >
                  {t("lost_found.contact", "Contact")}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// ─── Main Page ───
const LostFound = () => {
  const [activeTab, setActiveTab] = useState("lost");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showLostForm, setShowLostForm] = useState(false);
  const [showFoundForm, setShowFoundForm] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["lost-found", activeTab],
    queryFn: async () => {
      const { data } = await supabase
        .from("lost_found_posts")
        .select("*")
        .eq("type", activeTab)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="mx-auto px-4 py-6" style={{ maxWidth: 700 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F" }}>{t("lost_found.title", "Lost & Found")}</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
            <button onClick={() => setViewMode("list")} style={{ padding: "5px 10px", background: viewMode === "list" ? "#1E3A5F" : "#fff", color: viewMode === "list" ? "#fff" : "#64748B" }}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("map")} style={{ padding: "5px 10px", background: viewMode === "map" ? "#1E3A5F" : "#fff", color: viewMode === "map" ? "#fff" : "#64748B" }}>
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
          <Dialog open={showLostForm} onOpenChange={setShowLostForm}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ background: "#E74C3C", color: "#fff", fontSize: 12 }}><Plus className="w-4 h-4 mr-1" /> {t("lost_found.report_lost", "Report Lost")}</Button>
            </DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{t("lost_found.report_lost", "Report Lost")}</DialogTitle></DialogHeader><ReportForm type="lost" onSuccess={() => setShowLostForm(false)} /></DialogContent>
          </Dialog>
          <Dialog open={showFoundForm} onOpenChange={setShowFoundForm}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" style={{ fontSize: 12, borderColor: "#1E3A5F", color: "#1E3A5F" }}><Plus className="w-4 h-4 mr-1" /> {t("lost_found.report_found", "Report Found")}</Button>
            </DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>{t("lost_found.report_found", "Report Found")}</DialogTitle></DialogHeader><ReportForm type="found" onSuccess={() => setShowFoundForm(false)} /></DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="lost" style={{ fontSize: 13 }}>{t("lost_found.lost_tab", "🔴 Lost")}</TabsTrigger>
          <TabsTrigger value="found" style={{ fontSize: 13 }}>{t("lost_found.found_tab", "🟢 Found")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {viewMode === "map" ? (
            <LostFoundMap posts={posts} />
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse"><div style={{ height: 140 }} className="bg-muted" /><CardContent className="p-3 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></CardContent></Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <span style={{ fontSize: 48 }}>🐾</span>
              <h3 className="mt-3" style={{ fontSize: 15, fontWeight: 600, color: "#1E3A5F" }}>
                {activeTab === "lost" ? t("lost_found.no_lost", "No lost reports yet") : t("lost_found.no_found", "No found reports yet")}
              </h3>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                {activeTab === "lost" ? t("lost_found.no_lost_desc", "If you lost an animal, create a report with 'Report Lost'.") : t("lost_found.no_found_desc", "Found an animal? Reach the owner with 'Report Found'.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => <PostCard key={post.id} post={post} isOwner={user?.id === post.user_id} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LostFound;
