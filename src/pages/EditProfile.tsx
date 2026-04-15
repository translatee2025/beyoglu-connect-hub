import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    district_id: "",
    gender: "",
    age: "",
    photo_public: true,
    messages_public: true,
    age_public: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data } = await supabase.from("districts").select("*").order("name");
      return data || [];
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        district_id: profile.district_id || "",
        gender: (profile as any).gender || "",
        age: (profile as any).age?.toString() || "",
        photo_public: (profile as any).photo_public ?? true,
        messages_public: (profile as any).messages_public ?? true,
        age_public: (profile as any).age_public ?? false,
      });
    }
  }, [profile]);

  if (!user) { navigate("/auth"); return null; }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Yükleme başarısız", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    toast({ title: "Fotoğraf güncellendi" });
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData: any = {
      display_name: form.display_name,
      bio: form.bio,
      district_id: form.district_id || null,
      gender: form.gender || null,
      age: form.age ? parseInt(form.age) : null,
      photo_public: form.photo_public,
      messages_public: form.messages_public,
      age_public: form.age_public,
    };
    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);
    if (error) {
      toast({ title: "Kayıt başarısız", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Profil güncellendi" });
      navigate(`/profile/${user.id}`);
    }
    setSaving(false);
  };

  const initials = (profile?.display_name || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 py-6" style={{ maxWidth: 500 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted/50">
            <ArrowLeft className="w-5 h-5" style={{ color: "#1E3A5F" }} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F" }}>Profili Düzenle</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback style={{ background: "#1E3A5F", color: "#fff", fontSize: 24, fontWeight: 700 }}>{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#E74C3C", color: "#fff" }}>
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <span style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>Fotoğraf Değiştir</span>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>Görünen Ad</Label>
            <Input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="Adınız" />
          </div>

          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>Hakkında</Label>
            <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Kendinizi tanıtın..." rows={3} />
          </div>

          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>İlçe</Label>
            <Select value={form.district_id} onValueChange={v => setForm({ ...form, district_id: v })}>
              <SelectTrigger><SelectValue placeholder="İlçe seçin" /></SelectTrigger>
              <SelectContent>
                {districts.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>Cinsiyet</Label>
            <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Belirtmek istemiyorum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Erkek</SelectItem>
                <SelectItem value="female">Kadın</SelectItem>
                <SelectItem value="unspecified">Belirtmek istemiyorum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label style={{ fontSize: 12, color: "#64748B" }}>Yaş</Label>
            <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Opsiyonel" min={13} max={120} />
          </div>

          {/* Privacy toggles */}
          <div className="space-y-3 pt-2" style={{ borderTop: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F" }}>Gizlilik</p>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, color: "#64748B" }}>Fotoğrafım herkese görünsün</span>
              <Switch checked={form.photo_public} onCheckedChange={v => setForm({ ...form, photo_public: v })} />
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, color: "#64748B" }}>Bana herkes mesaj atabilsin</span>
              <Switch checked={form.messages_public} onCheckedChange={v => setForm({ ...form, messages_public: v })} />
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, color: "#64748B" }}>Yaşım görünsün</span>
              <Switch checked={form.age_public} onCheckedChange={v => setForm({ ...form, age_public: v })} />
            </div>
          </div>

          <Button className="w-full mt-4" onClick={handleSave} disabled={saving} style={{ background: "#1E3A5F", color: "#fff" }}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
