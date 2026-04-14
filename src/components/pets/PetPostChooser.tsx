import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Home, Users, AlertTriangle, Stethoscope, ShoppingBag } from "lucide-react";
import AdoptionForm from "./AdoptionForm";
import PetSittingForm from "./PetSittingForm";
import AddPetForm from "./AddPetForm";
import ReportLostPetForm from "./ReportLostPetForm";
import RegisterVenueForm from "./RegisterVenueForm";

type PostType = null | "adoption" | "sitting" | "friend" | "lost" | "shop" | "vet";

interface PetPostChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const postTypes = [
  { key: "adoption" as const, label: "Pet for Adoption", emoji: "🐾", icon: Heart, description: "Post a pet available for adoption" },
  { key: "sitting" as const, label: "Pet Sitting", emoji: "🏠", icon: Home, description: "Offer or find pet sitting services" },
  { key: "friend" as const, label: "Find a Friend", emoji: "❤️", icon: Users, description: "Add your pet to find playmates" },
  { key: "lost" as const, label: "Lost / Found", emoji: "🚨", icon: AlertTriangle, description: "Report a lost or found pet" },
  { key: "shop" as const, label: "Register Shop", emoji: "🛒", icon: ShoppingBag, description: "Add your pet shop to the directory" },
  { key: "vet" as const, label: "Register Vet", emoji: "🏥", icon: Stethoscope, description: "Add your vet clinic to the directory" },
];

const PetPostChooser = ({ open, onOpenChange, onSuccess }: PetPostChooserProps) => {
  const [selected, setSelected] = useState<PostType>(null);

  const handleClose = () => {
    setSelected(null);
    onOpenChange(false);
  };

  const handleSuccess = () => {
    setSelected(null);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {!selected ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">What would you like to post?</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {postTypes.map((pt) => (
                <button
                  key={pt.key}
                  onClick={() => setSelected(pt.key)}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-center group"
                >
                  <span className="text-3xl">{pt.emoji}</span>
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary">{pt.label}</span>
                  <span className="text-xs text-muted-foreground">{pt.description}</span>
                </button>
              ))}
            </div>
          </>
        ) : selected === "adoption" ? (
          <AdoptionForm onSuccess={handleSuccess} onBack={() => setSelected(null)} />
        ) : selected === "sitting" ? (
          <PetSittingForm onSuccess={handleSuccess} onBack={() => setSelected(null)} />
        ) : selected === "friend" ? (
          <AddPetForm onSuccess={handleSuccess} />
        ) : selected === "lost" ? (
          <ReportLostPetForm onSuccess={handleSuccess} />
        ) : selected === "shop" ? (
          <RegisterVenueForm type="shop" onSuccess={handleSuccess} onBack={() => setSelected(null)} />
        ) : selected === "vet" ? (
          <RegisterVenueForm type="vet" onSuccess={handleSuccess} onBack={() => setSelected(null)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default PetPostChooser;
