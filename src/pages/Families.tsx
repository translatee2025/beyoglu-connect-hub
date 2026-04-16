import { Heart } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const Families = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: "#FEE2E2" }}
      >
        <Heart className="w-8 h-8" style={{ color: "#E74C3C" }} />
      </div>
      <h1
        className="text-2xl font-bold mb-3"
        style={{ color: "#1E3A5F" }}
      >
        {t("families.title", "Aileler")}
      </h1>
      <p
        className="text-sm mb-8"
        style={{ color: "#64748B" }}
      >
        {t(
          "families.coming_soon",
          "Aileler bölümü çok yakında. Mahalledeki aileleri bul, çocuk aktiviteleri organize et."
        )}
      </p>
      <button
        className="text-white text-sm font-medium px-6 py-2.5 rounded-lg"
        style={{ backgroundColor: "#E74C3C" }}
      >
        {t("families.share", "Share")}
      </button>
    </div>
  );
};

export default Families;
