import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/providers/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Jobs = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      toast({ title: t("jobs.invalid_email", "Geçerli bir e-posta girin"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("waitlist" as any).insert({ email } as any);
    if (error) {
      toast({ title: t("jobs.already_registered", "Bu e-posta zaten kayıtlı"), variant: "destructive" });
    } else {
      toast({ title: t("jobs.success", "Kaydınız alındı! Sizi haberdar edeceğiz.") });
      setEmail("");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div style={{ textAlign: "center", padding: "24px 16px", maxWidth: 400 }}>
        <span style={{ fontSize: 64, display: "block", marginBottom: 20 }}>💼</span>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 8 }}>
          {t("jobs.title", "İş İlanları Yakında")}
        </h1>
        <p style={{ fontSize: 14, color: "hsl(var(--muted-foreground))", marginBottom: 28, lineHeight: 1.6 }}>
          {t("jobs.subtitle", "Beyoğlu Connect'te iş ilanları özelliği çok yakında. Takipte kal.")}
        </p>
        <div className="flex gap-2 max-w-xs mx-auto">
          <Input
            type="email"
            placeholder={t("jobs.email_placeholder", "E-posta adresiniz")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ background: "#E74C3C", color: "#fff", border: "none", whiteSpace: "nowrap" }}
          >
            {submitting ? "..." : t("jobs.notify_me", "Beni Haberdar Et")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
