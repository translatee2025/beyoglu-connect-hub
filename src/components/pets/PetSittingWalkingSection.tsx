import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserName } from "@/components/shared/UserName";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";

const pillStyle = (active: boolean) => ({
  backgroundColor: active ? "#1E3A5F" : "white",
  color: active ? "white" : "#64748B",
  border: `0.5px solid ${active ? "#1E3A5F" : "#E2EBFC"}`,
});

interface Props {
  onCreatePost: () => void;
}

const PetSittingWalkingSection = ({ onCreatePost }: Props) => {
  const [serviceType, setServiceType] = useState<"sitting" | "walking">("sitting");
  const [offerFilter, setOfferFilter] = useState<"all" | "offer" | "want">("all");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "nearest">("newest");
  const [priceOpen, setPriceOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["pet-sitting-walking-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_posts")
        .select("*")
        .eq("post_type", "pet_sitting")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  const applyPrice = () => {
    setAppliedMin(minPrice ? Number(minPrice) : null);
    setAppliedMax(maxPrice ? Number(maxPrice) : null);
  };

  const clearPrice = () => {
    setMinPrice(""); setMaxPrice("");
    setAppliedMin(null); setAppliedMax(null);
  };

  const filtered = useMemo(() => {
    let list = posts.filter((p: any) => {
      const st = p.service_type || "sitting";
      if (st !== serviceType) return false;
      if (offerFilter === "offer" && !p.is_offering) return false;
      if (offerFilter === "want" && p.is_offering) return false;
      return true;
    });

    // Price filter
    if (appliedMin !== null || appliedMax !== null) {
      list = list.filter((p: any) => {
        const num = parseFloat((p.price || "").replace(/[^\d.]/g, ""));
        if (isNaN(num)) return false;
        if (appliedMin !== null && num < appliedMin) return false;
        if (appliedMax !== null && num > appliedMax) return false;
        return true;
      });
    }

    // Sort
    if (sort === "newest") {
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "price_asc" || sort === "price_desc") {
      list.sort((a: any, b: any) => {
        const pa = parseFloat((a.price || "0").replace(/[^\d.]/g, "")) || 0;
        const pb = parseFloat((b.price || "0").replace(/[^\d.]/g, "")) || 0;
        return sort === "price_asc" ? pa - pb : pb - pa;
      });
    }

    return list;
  }, [posts, serviceType, offerFilter, sort, appliedMin, appliedMax]);

  return (
    <div className="space-y-4">
      {/* Service type toggle */}
      <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #E2EBFC", height: 40 }}>
        <button
          onClick={() => setServiceType("sitting")}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: serviceType === "sitting" ? "#1E3A5F" : "white",
            color: serviceType === "sitting" ? "white" : "#64748B",
          }}
        >
          🐾 Pet Sitting
        </button>
        <button
          onClick={() => setServiceType("walking")}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: serviceType === "walking" ? "#1E3A5F" : "white",
            color: serviceType === "walking" ? "white" : "#64748B",
          }}
        >
          🦮 Pet Walking
        </button>
      </div>

      {/* Offer/Want filter */}
      <div className="flex gap-2">
        {([
          { key: "all" as const, label: "Tümü" },
          { key: "offer" as const, label: "Ben Yaparım" },
          { key: "want" as const, label: "Arıyorum" },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setOfferFilter(f.key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={pillStyle(offerFilter === f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sort pills */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "newest" as const, label: "En Yeni" },
          { key: "price_asc" as const, label: "Fiyat ↑" },
          { key: "price_desc" as const, label: "Fiyat ↓" },
          { key: "nearest" as const, label: "Yakınımda" },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={pillStyle(sort === s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Price filter */}
      <div>
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "#64748B" }}
        >
          Fiyat Filtrele {priceOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {(appliedMin !== null || appliedMax !== null) && (
            <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4" style={{ backgroundColor: "#1E3A5F", color: "white" }}>✓</Badge>
          )}
        </button>
        {priceOpen && (
          <div className="flex items-center gap-2 mt-2">
            <Input placeholder="Min ₺" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-24 h-8 text-xs" style={{ border: "1px solid #E2EBFC" }} />
            <Input placeholder="Max ₺" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24 h-8 text-xs" style={{ border: "1px solid #E2EBFC" }} />
            <Button size="sm" className="h-8 text-xs px-3" style={{ backgroundColor: "#1E3A5F" }} onClick={applyPrice}>Uygula</Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={clearPrice}>Temizle</Button>
          </div>
        )}
      </div>

      {/* Cards */}
      {isLoading ? (
        <SkeletonGrid count={2} hasPhoto photoHeight={100} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">{serviceType === "sitting" ? "🏠" : "🦮"}</div>
          <p className="text-sm font-medium" style={{ color: "#1E3A5F" }}>
            {serviceType === "sitting" ? "Henüz pet sitting ilanı yok" : "Henüz pet walking ilanı yok"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>İlk ilanı siz oluşturun!</p>
          <Button size="sm" className="mt-3" style={{ backgroundColor: "#E74C3C" }} onClick={onCreatePost}>+ İlan Oluştur</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post: any) => {
            const isOffer = !!post.is_offering;
            return (
              <div
                key={post.id}
                className="p-3 rounded-xl bg-white"
                style={{
                  border: "1px solid #E2EBFC",
                  borderLeft: `3px solid ${isOffer ? "#166534" : "#D97706"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className="text-[10px] px-1.5 py-0 h-4" style={{
                    backgroundColor: serviceType === "sitting" ? "#EFF4FF" : "#F0FDF4",
                    color: serviceType === "sitting" ? "#1E3A5F" : "#166534",
                    border: "none",
                  }}>
                    {serviceType === "sitting" ? "Pet Sitting" : "Pet Walking"}
                  </Badge>
                  <Badge className="text-[10px] px-1.5 py-0 h-4" style={{
                    backgroundColor: isOffer ? "#DCFCE7" : "#FEF3C7",
                    color: isOffer ? "#166534" : "#D97706",
                    border: "none",
                  }}>
                    {isOffer ? "Ben Yaparım" : "Arıyorum"}
                  </Badge>
                  {post.species && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{post.species}</Badge>
                  )}
                </div>

                <p className="font-semibold text-[13px]" style={{ color: "#1E3A5F" }}>{post.title}</p>
                {post.description && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "#64748B" }}>{post.description}</p>}

                {post.price && (
                  <p className="text-[13px] font-bold mt-1" style={{ color: "#1E3A5F" }}>
                    {post.price}
                    {post.price_type && <span className="font-normal text-[10px]" style={{ color: "#94A3B8" }}> / {post.price_type === "per_hour" ? "saat" : "seans"}</span>}
                  </p>
                )}

                {post.user_id && <div className="mt-1"><UserName userId={post.user_id} showAvatar /></div>}

                {post.address && <p className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>📍 {post.address}</p>}

                <button
                  onClick={() => post.user_id && handleContact(post.user_id)}
                  className="w-full mt-2 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: "#E74C3C" }}
                >
                  İletişim
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PetSittingWalkingSection;
