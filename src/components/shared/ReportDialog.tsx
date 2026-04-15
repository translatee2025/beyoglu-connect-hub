import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Flag } from "lucide-react";

const REASONS = [
  "Spam",
  "Inappropriate content",
  "Misinformation",
  "Harassment",
  "Fake listing",
  "Abusive behavior",
  "Other",
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: string;
  contentId: string;
}

export function ReportDialog({ open, onOpenChange, contentType, contentId }: ReportDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selected) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      reason: selected,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error submitting report", variant: "destructive" });
    } else {
      toast({ title: "Report submitted", description: "Thank you. Our team will review this." });
      onOpenChange(false);
      setSelected(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" /> Report
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">Select a reason for reporting:</p>
        <div className="grid gap-2">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                selected === reason
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="w-full mt-3"
          variant="destructive"
        >
          {submitting ? "Submitting..." : "Confirm Report"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
