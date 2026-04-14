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

interface PetSittingFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

const PetSittingForm = ({ onSuccess, onBack }: PetSittingFormProps) => {
  const [isOffering, setIsOffering] = useState(true);
  const [form, setForm] = useState({
    title: "", description: "", price: "", phone: "", whatsapp: "", address: "",
  });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
      const { error } = await supabase.from("pet_posts").insert({
        user_id: user.id,
        post_type: "pet_sitting" as any,
        title: form.title,
        description: form.description,
        price: form.price,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
        is_offering: isOffering,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Pet sitting post created!" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <DialogTitle>🏠 Pet Sitting</DialogTitle>
        </div>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsOffering(true)}
            className={`p-3 rounded-lg border-2 text-center font-medium transition-all ${isOffering ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            I Offer Sitting
          </button>
          <button
            onClick={() => setIsOffering(false)}
            className={`p-3 rounded-lg border-2 text-center font-medium transition-all ${!isOffering ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            I Want a Sitter
          </button>
        </div>
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={isOffering ? "e.g. Experienced dog sitter available" : "e.g. Need cat sitter for weekend"} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={isOffering ? "Your experience, availability, which animals..." : "Details about your pet, dates needed..."} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Price</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. ₺200/day" /></div>
          <div><Label>Area</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Beyoğlu" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx..." /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+90 5xx..." /></div>
        </div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
};

export default PetSittingForm;
