import { useState } from "react";
import { Wrench, Search, Plus, User, ArrowLeft, ArrowRight, DollarSign, MapPin } from "lucide-react";
import { PhotoUploader } from "@/components/shared/PhotoUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserName } from "@/components/shared/UserName";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "@/providers/LocationProvider";
import { SkeletonList } from "@/components/shared/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";

import { useAppOptions } from "@/hooks/useAppOptions";
import { useMemo } from "react";

// timeAgo is defined inside the component to access t()

const NeighborHelp = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDistance } = useLocation();
  const { options: helpCats } = useAppOptions("help_categories");
  const helpCategoryKeys = useMemo(() => [
    { key: "All", label: t("filter.all", "All") },
    ...helpCats.map((o) => ({ key: o.value, label: o.label })),
  ], [helpCats, t]);

  const getCategoryLabel = (key: string | null) => {
    if (!key) return "";
    const k = key.toLowerCase();
    return helpCats.find((o) => o.value.toLowerCase() === k || o.label.toLowerCase() === k)?.label || key;
  };

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

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["neighbor-help", category],
    queryFn: async () => {
      let query = supabase.from("neighbor_help_posts").select("*").eq("status", "active").order("created_at", { ascending: false });
      if (category !== "All") query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = posts.filter((p: any) =>
    p.title.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto px-4 py-6" style={{ maxWidth: 700 }}>
      {/* Search + post button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94A3B8" }} />
          <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" style={{ fontSize: 13 }} />
        </div>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button size="sm" style={{ background: "#E74C3C", color: "#fff", border: "none", fontSize: 12 }}>
              <Plus className="w-4 h-4 mr-1" /> {t("common.post", "Post")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <HelpPostForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["neighbor-help"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {helpCategoryKeys.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12,
              fontWeight: category === cat.key ? 600 : 400,
              background: category === cat.key ? "#1E3A5F" : "#fff",
              color: category === cat.key ? "#fff" : "#64748B",
              border: category === cat.key ? "none" : "1px solid #E2E8F0",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🤝" message={t("empty.help", "No posts yet. Ask for help or offer your skills!")} actionLabel={t("help.post_title", "Post Help Listing")} onAction={() => setPostOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map((post: any) => {
            const isOffer = post.help_type === "offer";
            const distance = getDistance(null, null); // help posts don't have lat/lng
            return (
              <div key={post.id} className="rounded-xl" style={{ border: "1px solid #E2EBFC", padding: 14 }}>
                {/* Badges row */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                    background: isOffer ? "#DCFCE7" : "#FEF3C7",
                    color: isOffer ? "#16A34A" : "#D97706",
                  }}>
                    {isOffer ? t("help.i_can_help", "I Can Help") : t("help.i_need_help", "I Need Help")}
                  </span>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, border: "1px solid #E2E8F0", color: "#64748B" }}>
                    {getCategoryLabel(post.category)}
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>{timeAgo(post.created_at)}</span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", marginBottom: 4 }}>{post.title}</h3>

                {/* Description */}
                {post.description && (
                  <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {post.description}
                  </p>
                )}

                {/* Price */}
                {post.price && (
                  <p className="flex items-center gap-1 mb-2" style={{ fontSize: 13, fontWeight: 700, color: "#1E3A5F" }}>
                    ₺{post.price} {post.price_type === "per_hour" ? `(${t("help.price_hourly", "Hourly")})` : post.price_type === "per_day" ? `/ ${language === "tr" ? "gün" : "day"}` : post.price_type === "negotiable" ? `(${t("common.negotiable", "Negotiable")})` : `(${t("help.price_fixed", "Fixed")})`}
                  </p>
                )}

                {/* User info + district */}
                <div className="flex items-center gap-2 mb-3" style={{ fontSize: 12 }}>
                  {post.user_id && (
                    <Link to={`/profile/${post.user_id}`} onClick={(e) => e.stopPropagation()}>
                      <UserName userId={post.user_id} showAvatar avatarSize="w-5 h-5" className="text-[12px]" />
                    </Link>
                  )}
                  {post.neighborhood && (
                    <span className="flex items-center gap-0.5" style={{ color: "#94A3B8", fontSize: 11 }}>
                      <MapPin className="w-3 h-3" /> {post.neighborhood}
                    </span>
                  )}
                </div>

                {/* Contact button */}
                <button
                  className="w-full py-2 rounded-lg text-white font-medium"
                  style={{ background: "#E74C3C", fontSize: 12 }}
                  onClick={() => post.user_id && handleContact(post.user_id)}
                >
                  {t("common.contact", "Contact")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Help Post Form ───
const HelpPostForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", category: "other", helpType: "offer", neighborhood: "", phone: "", whatsapp: "", price: "", priceType: "fixed" });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { options: helpCats, isLoading: catsLoading } = useAppOptions("help_categories");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in");
      const { error } = await supabase.from("neighbor_help_posts").insert({
        user_id: user.id, help_type: form.helpType, category: form.category,
        title: form.title, description: form.description,
        neighborhood: form.neighborhood, phone: form.phone, whatsapp: form.whatsapp,
        price: form.price || null, price_type: form.priceType,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("common.posted", "Posted!") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div style={{ padding: 4 }}>
      <DialogHeader><DialogTitle style={{ fontSize: 16, fontWeight: 700, color: "#1E3A5F" }}>{t("help.post_title", "Post Help Listing")}</DialogTitle></DialogHeader>
      <Progress value={(step / 2) * 100} className="h-1.5 mt-3" />
      <p className="text-center mt-1 mb-4" style={{ fontSize: 11, color: "#94A3B8" }}>{step} / 2</p>

      {step === 1 && (
        <div className="space-y-4">
          {/* Help type — tappable cards */}
          <div>
            <Label style={{ fontSize: 12, color: "#64748B", marginBottom: 8, display: "block" }}>{t("help.what_to_do", "What would you like to do?")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setForm({ ...form, helpType: "offer" })}
                className="flex flex-col items-center gap-2 rounded-xl py-4 transition-all"
                style={{
                  width: "100%", minHeight: 100,
                  border: form.helpType === "offer" ? "2px solid #1E3A5F" : "1px solid #E2EBFC",
                  background: form.helpType === "offer" ? "#EFF4FF" : "#fff",
                }}
              >
                <Wrench className="w-7 h-7" style={{ color: "#16A34A" }} />
                <span style={{ fontSize: 12, fontWeight: form.helpType === "offer" ? 600 : 400, color: "#1E3A5F" }}>
                  {t("help.i_can_help", "I Can Help")}
                </span>
              </button>
              <button
                onClick={() => setForm({ ...form, helpType: "want" })}
                className="flex flex-col items-center gap-2 rounded-xl py-4 transition-all"
                style={{
                  width: "100%", minHeight: 100,
                  border: form.helpType === "want" ? "2px solid #1E3A5F" : "1px solid #E2EBFC",
                  background: form.helpType === "want" ? "#EFF4FF" : "#fff",
                }}
              >
                <User className="w-7 h-7" style={{ color: "#D97706" }} />
                <span style={{ fontSize: 12, fontWeight: form.helpType === "want" ? 600 : 400, color: "#1E3A5F" }}>
                  {t("help.i_need_help", "I Need Help")}
                </span>
              </button>
            </div>
          </div>

          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.category", "Category")}</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger style={{ fontSize: 13 }}><SelectValue /></SelectTrigger>
              <SelectContent>{catsLoading ? <SelectItem value="__loading" disabled>Loading...</SelectItem> : helpCats.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji ? `${c.emoji} ${c.label}` : c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.title", "Title")} *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("help.title_placeholder", "e.g. I can fix bathroom plumbing")} style={{ fontSize: 13 }} />
          </div>
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.description", "Description")}</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ fontSize: 13 }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.price", "Price")} (₺)</Label>
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="500" style={{ fontSize: 13 }} />
            </div>
            <div>
              <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.price_type", "Price Type")}</Label>
              <Select value={form.priceType} onValueChange={(v) => setForm({ ...form, priceType: v })}>
                <SelectTrigger style={{ fontSize: 13 }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t("common.fixed", "Fixed")}</SelectItem>
                  <SelectItem value="per_hour">{t("common.per_hour", "Per Hour")}</SelectItem>
                  <SelectItem value="per_day">{t("common.per_day", "Per Day")}</SelectItem>
                  <SelectItem value="negotiable">{t("common.negotiable", "Negotiable")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.photos", "Photos")}</Label>
            <PhotoUploader value={photos} onChange={setPhotos} maxFiles={5} pathPrefix="neighbor_help" />
          </div>
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.neighborhood", "Neighborhood")}</Label>
            <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} style={{ fontSize: 13 }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.phone", "Phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx" style={{ fontSize: 13 }} />
            </div>
            <div>
              <Label style={{ fontSize: 12, color: "#64748B" }}>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} style={{ fontSize: 13 }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-5">
        {step > 1 && <Button variant="outline" onClick={() => setStep(1)} className="gap-1" style={{ fontSize: 12 }}><ArrowLeft className="w-4 h-4" /> {t("common.back", "Back")}</Button>}
        {step < 2 ? (
          <Button className="flex-1 gap-1" onClick={() => setStep(2)} disabled={!form.title.trim()} style={{ background: "#1E3A5F", color: "#fff", fontSize: 12 }}>
            {t("common.next", "Next")} <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending} style={{ background: "#E74C3C", color: "#fff", fontSize: 12 }}>
            {mutation.isPending ? t("common.posting", "Posting...") : t("common.post", "Post")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NeighborHelp;
