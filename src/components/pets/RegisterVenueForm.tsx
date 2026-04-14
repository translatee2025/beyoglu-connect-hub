import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegisterVenueFormProps {
  type: "shop" | "vet";
  onSuccess: () => void;
  onBack: () => void;
}

const RegisterVenueForm = ({ type, onSuccess, onBack }: RegisterVenueFormProps) => {
  const isVet = type === "vet";
  const [form, setForm] = useState({
    title: "", description: "", address: "", phone: "", whatsapp: "",
  });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to register");
      const { error } = await supabase.from("pet_posts").insert({
        user_id: user.id,
        post_type: type as any,
        title: form.title,
        description: form.description,
        address: form.address,
        phone: form.phone,
        whatsapp: form.whatsapp,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: `${isVet ? "Vet clinic" : "Pet shop"} registered!` }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <DialogTitle>{isVet ? "🏥 Register Vet Clinic" : "🛒 Register Pet Shop"}</DialogTitle>
        </div>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>{isVet ? "Clinic Name" : "Shop Name"}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={isVet ? "e.g. Beyoğlu Veteriner" : "e.g. Happy Paws Pet Shop"} /></div>
        <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={isVet ? "Services offered, specialties..." : "Products, brands, services..."} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 2xx..." /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+90 5xx..." /></div>
        </div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? "Registering..." : `Register ${isVet ? "Vet Clinic" : "Pet Shop"}`}
        </Button>
      </div>
    </div>
  );
};

export default RegisterVenueForm;
