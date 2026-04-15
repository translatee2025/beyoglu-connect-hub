import { useState } from "react";
import { Wrench, Search, Plus, User, ArrowLeft, ArrowRight, DollarSign, MapPin } from "lucide-react";
import { MediaUpload } from "@/components/shared/MediaUpload";
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

const helpCategoryKeys = [
  { key: "All", tKey: "filter.all", fallback: "All" },
  { key: "Plumbing & Bathroom", tKey: "help.category.plumbing", fallback: "Plumbing & Bathroom" },
  { key: "Painting", tKey: "help.category.painting", fallback: "Painting" },
  { key: "Electrical", tKey: "help.category.electrical", fallback: "Electrical" },
  { key: "Assembly & Hanging", tKey: "help.category.assembly", fallback: "Assembly & Hanging" },
  { key: "Cleaning", tKey: "help.category.cleaning", fallback: "Cleaning" },
  { key: "Moving", tKey: "help.category.moving", fallback: "Moving" },
  { key: "Computer Repair", tKey: "help.category.computer", fallback: "Computer Repair" },
  { key: "Drilling & Mounting", tKey: "help.category.drilling", fallback: "Drilling & Mounting" },
  { key: "Car Wash", tKey: "help.category.carwash", fallback: "Car Wash" },
  { key: "Ironing", tKey: "help.category.ironing", fallback: "Ironing" },
  { key: "Babysitting", tKey: "help.category.babysitting", fallback: "Babysitting" },
  { key: "Gardening", tKey: "help.category.gardening", fallback: "Gardening" },
  { key: "Mixed / Other", tKey: "help.category.other", fallback: "Mixed / Other" },
];

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
};

const NeighborHelp = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getDistance } = useLocation();

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
          <Input placeholder={t("common.search", "Ara...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" style={{ fontSize: 13 }} />
        </div>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button size="sm" style={{ background: "#E74C3C", color: "#fff", border: "none", fontSize: 12 }}>
              <Plus className="w-4 h-4 mr-1" /> {t("common.post", "Paylaş")}
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
            {t(cat.tKey, cat.fallback)}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🤝" message={t("empty.help", "Henüz ilan yok. Yardım iste veya yardım teklif et!")} actionLabel={t("help.post_title", "Yardım İlanı Paylaş")} onAction={() => setPostOpen(true)} />
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
                    {isOffer ? t("help.i_can_help", "Yardım Edebilirim") : t("help.i_need_help", "Yardıma İhtiyacım Var")}
                  </span>
                  <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, border: "1px solid #E2E8F0", color: "#64748B" }}>
                    {post.category}
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
                    ₺{post.price} {post.price_type === "per_hour" ? "/ saat" : post.price_type === "per_day" ? "/ gün" : post.price_type === "negotiable" ? "(Pazarlık)" : "(Sabit)"}
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
                  {t("common.contact", "İletişim")}
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
  const [form, setForm] = useState({ title: "", description: "", category: "Mixed / Other", helpType: "offer", neighborhood: "", phone: "", whatsapp: "", price: "", priceType: "fixed" });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Lütfen giriş yapın");
      const { error } = await supabase.from("neighbor_help_posts").insert({
        user_id: user.id, help_type: form.helpType, category: form.category,
        title: form.title, description: form.description,
        neighborhood: form.neighborhood, phone: form.phone, whatsapp: form.whatsapp,
        price: form.price || null, price_type: form.priceType,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("common.posted", "Paylaşıldı!") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Hata"), description: e.message, variant: "destructive" }),
  });

  return (
    <div style={{ padding: 4 }}>
      <DialogHeader><DialogTitle style={{ fontSize: 16, fontWeight: 700, color: "#1E3A5F" }}>{t("help.post_title", "Yardım İlanı Paylaş")}</DialogTitle></DialogHeader>
      <Progress value={(step / 2) * 100} className="h-1.5 mt-3" />
      <p className="text-center mt-1 mb-4" style={{ fontSize: 11, color: "#94A3B8" }}>{step} / 2</p>

      {step === 1 && (
        <div className="space-y-4">
          {/* Help type — tappable cards */}
          <div>
            <Label style={{ fontSize: 12, color: "#64748B", marginBottom: 8, display: "block" }}>Ne yapmak istiyorsun?</Label>
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
                  {t("help.i_can_help", "Yardım Edebilirim")}
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
                  {t("help.i_need_help", "Yardıma İhtiyacım Var")}
                </span>
              </button>
            </div>
          </div>

          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.category", "Kategori")}</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger style={{ fontSize: 13 }}><SelectValue /></SelectTrigger>
              <SelectContent>{helpCategoryKeys.filter(c => c.key !== "All").map(c => <SelectItem key={c.key} value={c.key}>{t(c.tKey, c.fallback)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.title", "Başlık")} *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("help.title_placeholder", "örn. Banyo tesisatı tamir edebilirim")} style={{ fontSize: 13 }} />
          </div>
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.description", "Açıklama")}</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ fontSize: 13 }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.price", "Ücret")} (₺)</Label>
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="500" style={{ fontSize: 13 }} />
            </div>
            <div>
              <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.price_type", "Ücret Tipi")}</Label>
              <Select value={form.priceType} onValueChange={(v) => setForm({ ...form, priceType: v })}>
                <SelectTrigger style={{ fontSize: 13 }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{t("common.fixed", "Sabit")}</SelectItem>
                  <SelectItem value="per_hour">{t("common.per_hour", "Saatlik")}</SelectItem>
                  <SelectItem value="per_day">{t("common.per_day", "Günlük")}</SelectItem>
                  <SelectItem value="negotiable">{t("common.negotiable", "Pazarlık")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.photos", "Fotoğraf / Video")}</Label>
            <MediaUpload value={photos} onChange={setPhotos} maxFiles={5} />
          </div>
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.neighborhood", "Semt")}</Label>
            <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} style={{ fontSize: 13 }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.phone", "Telefon")}</Label>
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
        {step > 1 && <Button variant="outline" onClick={() => setStep(1)} className="gap-1" style={{ fontSize: 12 }}><ArrowLeft className="w-4 h-4" /> {t("common.back", "Geri")}</Button>}
        {step < 2 ? (
          <Button className="flex-1 gap-1" onClick={() => setStep(2)} disabled={!form.title.trim()} style={{ background: "#1E3A5F", color: "#fff", fontSize: 12 }}>
            {t("common.next", "İleri")} <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending} style={{ background: "#E74C3C", color: "#fff", fontSize: 12 }}>
            {mutation.isPending ? t("common.posting", "Paylaşılıyor...") : t("common.post", "Paylaş")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NeighborHelp;
