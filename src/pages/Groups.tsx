import { useState } from "react";
import { Users, Lock, Globe as GlobeIcon, UserPlus, Plus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const groupCategories = ["All", "Community", "Food & Dining", "Education", "Arts & Culture", "Sports", "Pets", "Family", "Other"];

const Groups = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("member_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = groups.filter((g: any) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || g.category === category;
    return matchesSearch && matchesCat;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "public": return <GlobeIcon className="w-4 h-4" />;
      case "request": return <UserPlus className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">Community Groups</h1>
            <p className="text-muted-foreground">Join groups to connect with neighbors who share your interests</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Create Group</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <GroupForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["groups"] }); }} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {groupCategories.map((cat) => (
              <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)}>{cat}</Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading groups...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No groups found</h3>
              <p className="text-muted-foreground">Create the first group!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((group: any) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{group.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {getTypeIcon(group.group_type)}
                              <span className="capitalize">{group.group_type}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">{group.member_count} members</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-3">{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      {group.group_type === "request" ? "Request to Join" : "Join Group"}
                    </Button>
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

const GroupForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState({ name: "", description: "", category: "Community", groupType: "public", neighborhood: "" });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to create a group");
      const { error } = await supabase.from("groups").insert({
        name: form.name,
        description: form.description,
        category: form.category,
        group_type: form.groupType,
        neighborhood: form.neighborhood,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Group created!" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Create a Group</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Group Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Beyoğlu Book Club" /></div>
        <div><Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{groupCategories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Type</Label>
          <Select value={form.groupType} onValueChange={(v) => setForm({ ...form, groupType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public — Anyone can join</SelectItem>
              <SelectItem value="request">Request — Approval needed</SelectItem>
              <SelectItem value="private">Private — Invite only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Neighborhood</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Beyoğlu" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this group about?" /></div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Group"}
        </Button>
      </div>
    </div>
  );
};

export default Groups;
