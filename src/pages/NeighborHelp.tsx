import { useState } from "react";
import { Wrench, Search, Plus, User, ArrowLeft, ArrowRight, HandHelping, DollarSign, MapPin } from "lucide-react";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

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

const NeighborHelp = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("time.just_now", "just now");
    if (mins < 60) return `${mins} ${t("time.minutes_ago", "m ago")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t("time.hours_ago", "h ago")}`;
    return `${Math.floor(hrs / 24)} ${t("time.days_ago", "d ago")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">



          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> {t("common.post", "Post")}</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <HelpPostForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["neighbor-help"] }); }} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {helpCategoryKeys.map((cat) => (
              <Button key={cat.key} variant={category === cat.key ? "default" : "outline"} size="sm" onClick={() => setCategory(cat.key)}>{t(cat.tKey, cat.fallback)}</Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t("common.loading", "Loading...")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("help.empty", "No posts yet")}</h3>
              <p className="text-muted-foreground">{t("help.be_first", "Be the first to offer or ask for help!")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((post: any) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {post.help_type === "offer" ? <Wrench className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={post.help_type === "offer" ? "default" : "secondary"}>
                            {post.help_type === "offer" ? t("help.i_can_help", "I Can Help") : t("help.i_need_help", "I Need Help")}
                          </Badge>
                          <Badge variant="outline">{post.category}</Badge>
                          <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                        </div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        {post.description && <p className="text-sm text-muted-foreground mt-1">{post.description}</p>}
                        {post.price && (
                          <p className="text-sm font-semibold text-primary mt-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> ₺{post.price} {post.price_type === "per_hour" ? "/ hour" : "(fixed)"}
                          </p>
                        )}
                        {post.user_id && <div className="mt-1"><UserName userId={post.user_id} showAvatar /></div>}
                        {post.neighborhood && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {post.neighborhood}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => post.user_id && handleContact(post.user_id)}>{t("common.contact", "Contact")}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HelpPostForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", category: "Mixed / Other", helpType: "offer", neighborhood: "", phone: "", whatsapp: "", price: "", priceType: "fixed" });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
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
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{t("help.post_title", "Post Help Offer or Request")}</DialogTitle></DialogHeader>
      <Progress value={(step / 2) * 100} className="h-1.5" />
      <p className="text-xs text-muted-foreground text-center">{t("common.step_of", "Step")} {step} / 2</p>

      {step === 1 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant={form.helpType === "offer" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setForm({ ...form, helpType: "offer" })}>
              <Wrench className="w-4 h-4" /> {t("help.i_can_help", "I Can Help")}
            </Button>
            <Button variant={form.helpType === "want" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setForm({ ...form, helpType: "want" })}>
              <User className="w-4 h-4" /> {t("help.i_need_help", "I Need Help")}
            </Button>
          </div>
          <div><Label>{t("common.category", "Category")}</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{helpCategoryKeys.filter(c => c.key !== "All").map(c => <SelectItem key={c.key} value={c.key}>{t(c.tKey, c.fallback)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("common.title", "Title")} *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("help.title_placeholder", "e.g. Can fix bathroom leaks")} /></div>
          <div><Label>{t("common.description", "Description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.price", "Price")} (₺)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="500" /></div>
            <div><Label>{t("common.price_type", "Price Type")}</Label>
              <Select value={form.priceType} onValueChange={(v) => setForm({ ...form, priceType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
        <div className="space-y-3">
          <div><Label>{t("common.photos", "Photos / Videos")}</Label><MediaUpload value={photos} onChange={setPhotos} maxFiles={5} /></div>
          <div><Label>{t("common.neighborhood", "Neighborhood")}</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.phone", "Phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx" /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {step > 1 && <Button variant="outline" onClick={() => setStep(1)} className="gap-1"><ArrowLeft className="w-4 h-4" /> {t("common.back", "Back")}</Button>}
        {step < 2 ? (
          <Button className="flex-1 gap-1" onClick={() => setStep(2)} disabled={!form.title.trim()}>{t("common.next", "Next")} <ArrowRight className="w-4 h-4" /></Button>
        ) : (
          <Button className="flex-1" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>{mutation.isPending ? t("common.posting", "Posting...") : t("common.post", "Post")}</Button>
        )}
      </div>
    </div>
  );
};

export default NeighborHelp;
