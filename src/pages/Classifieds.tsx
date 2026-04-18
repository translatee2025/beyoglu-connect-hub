import { useState, useRef } from "react";
import { Search, Plus, Flag, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ClassifiedPostForm from "@/components/classifieds/ClassifiedPostForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserName } from "@/components/shared/UserName";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { DistanceLabel } from "@/components/shared/DistanceLabel";
import SortFilterBar, { type SortOption } from "@/components/shared/SortFilterBar";
import { parsePhotos } from "@/lib/parsePhotos";
import { useAppOptions } from "@/hooks/useAppOptions";

const categoryMeta: Record<string, { bg: string; emoji: string }> = {
  Electronics: { bg: "#EFF4FF", emoji: "📱" },
  Furniture: { bg: "#FEF3C7", emoji: "🪑" },
  Clothing: { bg: "#EDE9FE", emoji: "👕" },
  Books: { bg: "#DCFCE7", emoji: "📚" },
  Vehicles: { bg: "#F1F5F9", emoji: "🚗" },
  Services: { bg: "#E0F2FE", emoji: "🛠️" },
  Other: { bg: "#F9FAFB", emoji: "📦" },
};

const parsePrice = (p: string | null) => {
  if (!p) return 0;
  return parseFloat(p.replace(/[^0-9.]/g, "")) || 0;
};

const Classifieds = () => {
  const [reportTarget, setReportTarget] = useState<{ id: string } | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const subRef = useRef<HTMLDivElement>(null);

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  const formatTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === "tr" ? "şimdi" : "now";
    if (mins < 60) return language === "tr" ? `${mins}dk` : `${mins}m`;
    const h = Math.floor(mins / 60);
    if (h < 24) return language === "tr" ? `${h}s` : `${h}h`;
    const days = Math.floor(h / 24);
    return language === "tr" ? `${days}g` : `${days}d`;
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["classified-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classified_categories")
        .select("*")
        .eq("section", "classifieds")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const categoryNames = ["All", ...categories.map((c: any) => c.name)];

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["classifieds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classifieds")
        .select("*, user_id")
        .eq("section", "classifieds")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const processItems = () => {
    let items = listings.filter((item: any) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = category === "All" || item.category === category;
      return matchesSearch && matchesCat;
    });

    if (appliedMin !== null) items = items.filter((i: any) => parsePrice(i.price) >= appliedMin);
    if (appliedMax !== null) items = items.filter((i: any) => parsePrice(i.price) <= appliedMax);

    const sorted = [...items];
    if (sort === "price_asc") sorted.sort((a: any, b: any) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === "price_desc") sorted.sort((a: any, b: any) => parsePrice(b.price) - parsePrice(a.price));
    else sorted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return sorted;
  };

  const applyFilter = () => {
    setAppliedMin(priceMin ? parseFloat(priceMin) : null);
    setAppliedMax(priceMax ? parseFloat(priceMax) : null);
  };
  const clearFilter = () => { setPriceMin(""); setPriceMax(""); setAppliedMin(null); setAppliedMax(null); };
  const filterActive = appliedMin !== null || appliedMax !== null;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSubCategory(null);
  };

  const subGroupKey = category !== "All" && category !== "Other" ? `classified_sub_${category.toLowerCase()}` : "";
  const { options: subOptions } = useAppOptions(subGroupKey);
  const { options: classifiedCats } = useAppOptions("classified_categories");
  const currentSubCats = category !== "All" && category !== "Other" ? subOptions.map(o => o.label) : [];

  const getMeta = (cat: string | null) => categoryMeta[cat || "Other"] || categoryMeta.Other;
  const getCatLabel = (cat: string | null) => {
    if (!cat) return cat;
    const norm = cat.toLowerCase().replace(/\s+/g, "_").replace(/&/g, "and");
    const found = classifiedCats.find(o =>
      o.value === norm ||
      o.label.toLowerCase() === cat.toLowerCase() ||
      (o as any).metadata?.aliases?.includes?.(cat)
    );
    if (found) return found.label;
    return categories.find((c: any) => c.name === cat || c.slug === cat?.toLowerCase())?.name || cat;
  };

  const ClassifiedCard = ({ item }: { item: any }) => {
    const photo = parsePhotos(item.photos)[0] || null;
    const meta = getMeta(item.category);

    return (
      <div style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "white", border: "1px solid #E2EBFC" }}>
        <div style={{ position: "relative", height: 140, backgroundColor: meta.bg }}>
          {photo ? (
            <img src={photo} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              {meta.emoji}
            </div>
          )}
        </div>

        <div style={{ padding: 12 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <div className="flex items-center gap-2">
              {item.category && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, backgroundColor: "#F1F5F9", color: "#64748B" }}>
                  {getCatLabel(item.category)}
                </span>
              )}
            </div>
            {user && item.user_id && item.user_id !== user.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setReportTarget({ id: item.id })}>
                    <Flag className="w-4 h-4 mr-2" /> {t("common.report", "Report")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", marginBottom: 4 }}>{item.title}</div>

          {item.price && (
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1E3A5F", marginBottom: 6 }}>
              {item.currency || "₺"}{item.price}
            </div>
          )}

          {item.description && (
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
            {item.user_id && <UserName userId={item.user_id} showAvatar avatarSize="w-4 h-4" />}
            <span style={{ fontSize: 11, color: "#94A3B8" }}>· {formatTimeAgo(item.created_at)}</span>
          </div>

          <DistanceLabel lat={item.lat} lng={item.lng} neighborhood={item.neighborhood} />
        </div>

        <button
          onClick={() => item.user_id && handleContact(item.user_id)}
          style={{
            width: "100%", padding: 8, backgroundColor: "#E74C3C", color: "white",
            fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer",
            borderRadius: "0 0 12px 12px",
          }}
        >
          {t("common.message", "Message")}
        </button>
      </div>
    );
  };

  const processed = processItems();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> {t("common.post_listing", "Post Listing")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <ClassifiedPostForm
                  categories={categories.map((c: any) => c.name)}
                  onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["classifieds"] }); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {categoryNames.map((cat) => (
              <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => handleCategoryChange(cat)}>
                {cat === "All" ? t("classifieds.all", "All") : cat}
              </Button>
            ))}
          </div>

          {currentSubCats.length > 0 && (
            <div
              ref={subRef}
              className="flex gap-2 mb-4 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {currentSubCats.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubCategory(subCategory === sub ? null : sub)}
                  className="flex-shrink-0 transition-colors"
                  style={{
                    padding: "4px 12px", borderRadius: 16, fontSize: 11,
                    fontWeight: subCategory === sub ? 500 : 400,
                    backgroundColor: subCategory === sub ? "#1E3A5F" : "white",
                    color: subCategory === sub ? "white" : "#64748B",
                    border: subCategory === sub ? "none" : "0.5px solid #E2EBFC",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          <SortFilterBar
            sort={sort} onSortChange={setSort}
            priceMin={priceMin} priceMax={priceMax}
            onPriceMinChange={setPriceMin} onPriceMaxChange={setPriceMax}
            onApplyFilter={applyFilter} onClearFilter={clearFilter}
            filterActive={filterActive}
          />

          {isLoading ? (
            <SkeletonGrid count={4} hasPhoto photoHeight={140} />
          ) : processed.length === 0 ? (
            <EmptyState emoji="🛍️" message={t("classifieds.no_listings", "No listings yet. Be the first to post!")} actionLabel={t("common.post_listing", "Post Listing")} onAction={() => setPostOpen(true)} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {processed.map((item: any) => (
                <ClassifiedCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={(o) => { if (!o) setReportTarget(null); }}
          contentType="classified"
          contentId={reportTarget.id}
        />
      )}
    </div>
  );
};

export default Classifieds;
