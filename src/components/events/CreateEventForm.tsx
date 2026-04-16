import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PhotoUploader } from "@/components/shared/PhotoUploader";

const CATEGORIES = ["Music", "Sports", "Food", "Art", "Networking", "Community", "Other"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateEventForm({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [coverPhotos, setCoverPhotos] = useState<string[]>([]);

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const coverUrl = coverPhotos.length > 0 ? coverPhotos[0] : null;

      const { error } = await supabase.from("events").insert({
        user_id: user.id,
        title,
        description: description || null,
        category: category || null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        venue_name: venueName || null,
        address: address || null,
        is_free: isFree,
        price: isFree ? null : parseFloat(price) || null,
        cover_photo: coverUrl,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: t("events.created", "Etkinlik oluşturuldu!") });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: t("common.error", "Hata"), description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory(""); setStartAt(""); setEndAt("");
    setVenueName(""); setAddress(""); setIsFree(true); setPrice("");
    setCoverPhotos([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("events.create", "Etkinlik Oluştur")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createEvent.mutate(); }} className="space-y-4">
          <div>
            <Label>{t("events.field_title", "Başlık")} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <Label>{t("events.field_description", "Açıklama")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div>
            <Label>{t("events.field_category", "Kategori")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder={t("events.select_category", "Kategori seçin")} /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("events.field_start", "Başlangıç")} *</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
            </div>
            <div>
              <Label>{t("events.field_end", "Bitiş")}</Label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>{t("events.field_venue", "Mekan Adı")}</Label>
            <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} />
          </div>

          <div>
            <Label>{t("events.field_address", "Adres")}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <Label>{t("events.field_free", "Ücretsiz mi?")}</Label>
            <Switch checked={isFree} onCheckedChange={setIsFree} />
          </div>

          {!isFree && (
            <div>
              <Label>{t("events.field_price", "Fiyat (TRY)")}</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          )}

          <div>
            <Label>{t("events.field_cover", "Kapak Fotoğrafı")}</Label>
            <PhotoUploader value={coverPhotos} onChange={setCoverPhotos} maxFiles={1} storageBucket="events" pathPrefix="covers" />
          </div>

          <Button type="submit" className="w-full" disabled={createEvent.isPending || !title || !startAt}>
            {createEvent.isPending ? t("common.saving", "Kaydediliyor...") : t("events.create", "Etkinlik Oluştur")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
