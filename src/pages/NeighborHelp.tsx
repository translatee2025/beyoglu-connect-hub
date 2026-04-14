import { useState } from "react";
import { Wrench, Search, Plus, User } from "lucide-react";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const helpCategories = ["All", "Plumbing & Bathroom", "Painting", "Furniture Repair", "Electrical", "Assembly & Hanging", "Mixed / Other"];

const NeighborHelp = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["neighbor-help", category],
    queryFn: async () => {
      let query = supabase.from("neighbor_help_posts").select("*").eq("status", "active").order("created_at", { ascending: false });
      if (category !== "All") {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = posts.filter((p: any) =>
    p.title.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">🤝 Neighbor Help</h1>
            <p className="text-muted-foreground">Offer or ask for help from your neighbors</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Post</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <HelpPostForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["neighbor-help"] }); }} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {helpCategories.map((cat) => (
              <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)}>{cat}</Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to offer or ask for help!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((post: any) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {post.help_type === "offer" ? <Wrench className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={post.help_type === "offer" ? "default" : "secondary"}>
                            {post.help_type === "offer" ? "I Can Help" : "I Need Help"}
                          </Badge>
                          <Badge variant="outline">{post.category}</Badge>
                          <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                        </div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        {post.description && <p className="text-sm text-muted-foreground mt-1">{post.description}</p>}
                        {post.neighborhood && <p className="text-xs text-muted-foreground mt-1">📍 {post.neighborhood}</p>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Contact</Button>
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

const HelpPostForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState({ title: "", description: "", category: "Mixed / Other", helpType: "offer", neighborhood: "", phone: "", whatsapp: "" });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
      const { error } = await supabase.from("neighbor_help_posts").insert({
        user_id: user.id,
        help_type: form.helpType,
        category: form.category,
        title: form.title,
        description: form.description,
        neighborhood: form.neighborhood,
        phone: form.phone,
        whatsapp: form.whatsapp,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Posted!" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Post Help Offer or Request</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button variant={form.helpType === "offer" ? "default" : "outline"} className="flex-1" onClick={() => setForm({ ...form, helpType: "offer" })}>
            🛠️ I Can Help
          </Button>
          <Button variant={form.helpType === "want" ? "default" : "outline"} className="flex-1" onClick={() => setForm({ ...form, helpType: "want" })}>
            🙋 I Need Help
          </Button>
        </div>
        <div><Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{helpCategories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Can fix bathroom leaks" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Neighborhood</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
};

export default NeighborHelp;
