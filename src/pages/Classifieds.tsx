import { useState } from "react";
import { ShoppingBag, Search, Plus, MapPin, MoreHorizontal, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const Classifieds = () => {
  const [reportTarget, setReportTarget] = useState<{ id: string } | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
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

  const filtered = listings.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || item.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">



          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> {t("classifieds.post_ad", "Post Ad")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <ClassifiedPostForm
                  categories={categories.map((c: any) => c.name)}
                  onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["classifieds"] }); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categoryNames.map((cat) => (
              <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <SkeletonGrid count={2} />
          ) : filtered.length === 0 ? (
            <EmptyState emoji="🛍️" message={t("empty.classifieds", "Henüz ilan yok. İlk ilanı sen ver!")} actionLabel={t("classifieds.post_ad", "Post Ad")} onAction={() => setPostOpen(true)} />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((item: any) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant={item.type === "offer" ? "default" : "secondary"}>
                              {item.type === "offer" ? t("classifieds.offering", "Offering") : t("classifieds.looking_for", "Looking for")}
                            </Badge>
                            {item.category && <Badge variant="outline">{item.category}</Badge>}
                          </div>
                          {user && item.user_id && item.user_id !== user.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setReportTarget({ id: item.id })}>
                                  <Flag className="w-4 h-4 mr-2" /> Report listing
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-1">{item.title}</CardTitle>
                        {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                        {item.price && <p className="text-primary font-semibold mt-2">{item.currency}{item.price}</p>}
                        {item.user_id && <div className="mt-1"><UserName userId={item.user_id} showAvatar /></div>}
                        {item.neighborhood && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" /> {item.neighborhood}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" onClick={() => item.user_id && handleContact(item.user_id)}>{t("common.contact", "Contact")}</Button>
                  </CardContent>
                </Card>
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
