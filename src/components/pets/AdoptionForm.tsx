import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdoptionFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AdoptionForm = ({ onSuccess, onBack }: AdoptionFormProps) => {
  const [form, setForm] = useState({
    title: "", species: "dog", breed: "", age_text: "", gender: "", description: "", phone: "", whatsapp: "", address: "",
  });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
      const { error } = await supabase.from("pet_posts").insert({
        user_id: user.id,
        post_type: "adoption" as any,
        title: form.title,
        species: form.species,
        breed: form.breed,
        age_text: form.age_text,
        gender: form.gender,
        description: form.description,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Adoption post created!" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <DialogTitle>🐾 Post Pet for Adoption</DialogTitle>
        </div>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>Pet Name / Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sweet tabby cat looking for home" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Species</Label>
            <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dog</SelectItem><SelectItem value="cat">Cat</SelectItem>
                <SelectItem value="bird">Bird</SelectItem><SelectItem value="rabbit">Rabbit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Breed</Label><Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="e.g. Tabby" /></div>
          <div><Label>Age</Label><Input value={form.age_text} onChange={(e) => setForm({ ...form, age_text: e.target.value })} placeholder="e.g. 2 years" /></div>
        </div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell us about this pet..." /></div>
        <div><Label>Location / Area</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Cihangir" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx..." /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+90 5xx..." /></div>
        </div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? "Posting..." : "Post for Adoption"}
        </Button>
      </div>
    </div>
  );
};

export default AdoptionForm;
