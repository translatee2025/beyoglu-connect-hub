import { useState } from "react";
import { ShoppingBag, Search, Plus, MapPin } from "lucide-react";
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

const Classifieds = () => {
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
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">{t("classifieds.title", "Classifieds")}</h1>
            <p className="text-muted-foreground">{t("classifieds.subtitle", "Buy, sell, and exchange services within the community")}</p>
          </div>

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
            <div className="text-center py-12 text-muted-foreground">{t("common.loading", "Loading...")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("classifieds.empty", "No classifieds found")}</h3>
              <p className="text-muted-foreground mb-4">{t("classifieds.be_first", "Be the first to post an ad!")}</p>
              <Button onClick={() => setPostOpen(true)}><Plus className="w-4 h-4 mr-2" /> {t("classifieds.post_ad", "Post Ad")}</Button>
            </div>
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
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={item.type === "offer" ? "default" : "secondary"}>
                            {item.type === "offer" ? t("classifieds.offering", "Offering") : t("classifieds.looking_for", "Looking for")}
                          </Badge>
                          {item.category && <Badge variant="outline">{item.category}</Badge>}
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
    </div>
  );
};

export default Classifieds;
