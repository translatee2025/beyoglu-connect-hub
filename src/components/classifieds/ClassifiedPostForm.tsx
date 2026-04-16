import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PhotoUploader } from "@/components/shared/PhotoUploader";
import { useLanguage } from "@/providers/LanguageProvider";

interface ClassifiedPostFormProps { categories: string[]; onSuccess: () => void; }

const ClassifiedPostForm = ({ categories, onSuccess }: ClassifiedPostFormProps) => {
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "", type: "offer", phone: "", neighborhood: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("common.login_required", "Please log in to post"));
      const { error } = await supabase.from("classifieds").insert({ user_id: user.id, section: "classifieds" as any, category: form.category, title: form.title, description: form.description, price: form.price, type: form.type, phone: form.phone, neighborhood: form.neighborhood, photos });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("classifieds.post_btn", "Ad posted!") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{t("classifieds.post_ad", "Post a Classified Ad")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>{t("classifieds.title_label", "Title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("classifieds.title_placeholder", "What are you offering or looking for?")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("classifieds.type", "Type")}</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="offer">{t("classifieds.offering", "Offering")}</SelectItem><SelectItem value="need">{t("classifieds.looking_for", "Looking for")}</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>{t("classifieds.category", "Category")}</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("classifieds.price", "Price")}</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. ₺500" /></div>
          <div><Label>{t("classifieds.neighborhood", "Neighborhood")}</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="e.g. Beyoğlu" /></div>
        </div>
        <div><Label>{t("classifieds.description", "Description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>{t("classifieds.photos", "Photos")}</Label><PhotoUploader value={photos} onChange={setPhotos} maxFiles={5} pathPrefix="classifieds" /></div>
        <div><Label>{t("classifieds.phone", "Phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? t("common.posting", "Posting...") : t("classifieds.post_btn", "Post Ad")}
        </Button>
      </div>
    </div>
  );
};

export default ClassifiedPostForm;
