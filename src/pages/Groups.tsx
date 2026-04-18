import { useMemo, useState, useRef } from "react";
import { Users, Lock, Globe as GlobeIcon, UserPlus, Plus, Search, X, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";

import { useAppOptions } from "@/hooks/useAppOptions";

const CATEGORY_COLORS: Record<string, string> = {
  community: "#E0F2FE", "food-dining": "#FEF3C7", sports: "#DCFCE7", pets: "#FCE7F3",
  "arts-culture": "#EDE9FE", education: "#DBEAFE", business: "#F1F5F9", family: "#FFF7ED", other: "#EFF4FF",
};

// GROUP_TYPES moved inside component to access t()

const legacyCategoryMap: Record<string, string> = {
  Community: "community", "Food & Dining": "food-dining", Education: "education",
  "Arts & Culture": "arts-culture", Sports: "sports", Pets: "pets", Family: "family", Other: "other",
};
const normalizeCategory = (v: string) => legacyCategoryMap[v] || v;

// timeAgo moved inside component to access t()

const Groups = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [postOpen, setPostOpen] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { options: groupCats } = useAppOptions("group_categories");
  const CATEGORIES = useMemo(() => groupCats.map((o) => ({ key: o.value, label: o.label, emoji: o.emoji || "🌟" })), [groupCats]);
  const CATEGORY_EMOJI: Record<string, string> = useMemo(() => Object.fromEntries(groupCats.map((o) => [o.value, o.emoji || "🌟"])), [groupCats]);

  const GROUP_TYPES = [
    { key: "public", label: t("groups.type.public", "Public"), desc: t("groups.type.public_desc", "Anyone can join"), icon: GlobeIcon, color: "#16A34A" },
    { key: "request", label: t("groups.type.request", "Request Required"), desc: t("groups.type.request_desc", "Admin approves"), icon: UserPlus, color: "#D97706" },
    { key: "private", label: t("groups.type.private", "Private"), desc: t("groups.type.private_desc", "Invite only"), icon: Lock, color: "#1E3A5F" },
  ];

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === "tr" ? "şimdi" : "now";
    if (mins < 60) return language === "tr" ? `${mins}dk` : `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return language === "tr" ? `${hrs}s` : `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return language === "tr" ? `${days}g` : `${days}d`;
  };

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, description, category, group_type, neighborhood, member_count, cover_photo, created_by")
        .order("member_count", { ascending: false });
      if (error) throw error;
      return (data || []).map((g: any) => ({ ...g, category: normalizeCategory(g.category), group_type: g.group_type || "public" }));
    },
  });

  // Fetch last post date per group
  const groupIds = groups.map((g: any) => g.id);
  const { data: lastPosts = {} } = useQuery({
    queryKey: ["group-last-posts", groupIds.join(",")],
    queryFn: async () => {
      if (!groupIds.length) return {};
      const { data } = await supabase
        .from("wall_posts")
        .select("group_id, created_at")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { if (!map[p.group_id]) map[p.group_id] = p.created_at; });
      return map;
    },
    enabled: groupIds.length > 0,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["group-memberships", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("group_members").select("group_id, role").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const membershipMap = useMemo(() => new Map(memberships.map((m: any) => [m.group_id, m.role])), [memberships]);

  const filtered = groups.filter((g: any) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || g.category === category;
    return matchSearch && matchCat;
  });

  const joinMutation = useMutation({
    mutationFn: async (group: any) => {
      if (!user) throw new Error("Login required");
      if (group.group_type === "private") throw new Error("Invite only");

      const role = group.group_type === "request" ? "pending" : "member";
      const { error } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id, role });
      if (error) throw error;

      if (role === "member") {
        await supabase.from("groups").update({ member_count: (group.member_count || 0) + 1 }).eq("id", group.id);
      }

      // Send notification to owner for request groups
      if (role === "pending") {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        const name = profile?.display_name || "Someone";
        await supabase.from("notifications").insert({
          user_id: group.created_by,
          type: "group_request",
          title: "Group join request",
          body: `${name} wants to join the group`,
          link: `/groups/${group.id}`,
        });
      }
    },
    onSuccess: (_, group: any) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group-memberships", user?.id] });
      toast({
        title: group.group_type === "request"
          ? t("groups.toast.request_sent", "Join request sent")
          : t("groups.toast.joined", "You joined the group"),
      });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error", "Error"), description: err.message, variant: "destructive" });
    },
  });

  const handleJoin = (group: any) => {
    if (!user) { navigate("/auth"); return; }
    if (membershipMap.has(group.id)) return;
    joinMutation.mutate(group);
  };

  const getTypeBadge = (type: string) => {
    if (type === "public") return { label: t("groups.type.public", "Public"), bg: "#DCFCE7", color: "#16A34A" };
    if (type === "request") return { label: t("groups.type.request", "Request"), bg: "#FEF3C7", color: "#D97706" };
    return { label: t("groups.type.private", "Private"), bg: "#E0F2FE", color: "#1E3A5F" };
  };

  return (
    <div className="mx-auto px-4 py-6" style={{ maxWidth: 700 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F" }}>{t("groups.title", "Community Groups")}</h1>
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button size="sm" style={{ background: "#E74C3C", color: "#fff", border: "none", fontSize: 12 }}>
              <Plus className="w-4 h-4 mr-1" /> {t("groups.create", "Create Group")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <CreateGroupForm onSuccess={() => {
              setPostOpen(false);
              queryClient.invalidateQueries({ queryKey: ["groups"] });
              queryClient.invalidateQueries({ queryKey: ["group-memberships", user?.id] });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94A3B8" }} />
        <Input placeholder={t("groups.search_placeholder", "Grup ara...")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" style={{ fontSize: 13 }} />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[{ key: "all", label: t("groups.category.all", "All") }, ...CATEGORIES.map(c => ({ key: c.key, label: c.label }))].map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12,
              fontWeight: category === tab.key ? 600 : 400,
              background: category === tab.key ? "#1E3A5F" : "#fff",
              color: category === tab.key ? "#fff" : "#64748B",
              border: category === tab.key ? "none" : "1px solid #E2E8F0",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Group list */}
      {isLoading && groups.length === 0 ? (
        <SkeletonGrid count={2} hasPhoto photoHeight={120} />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="👥" message={t("empty.groups", "No groups yet. Create the first one!")} actionLabel={t("groups.create", "Create Group")} onAction={() => setPostOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((group: any) => {
            const role = membershipMap.get(group.id);
            const isJoined = role === "owner" || role === "member" || role === "admin";
            const isPending = role === "pending";
            const badge = getTypeBadge(group.group_type);
            const emoji = CATEGORY_EMOJI[group.category] || "🌟";
            const bgColor = CATEGORY_COLORS[group.category] || "#EFF4FF";
            const lastPostDate = (lastPosts as any)[group.id];

            return (
              <div
                key={group.id}
                className="bg-card rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                style={{ border: "1px solid #E2EBFC" }}
                onClick={() => navigate(`/groups/${group.id}`)}
              >
                {/* Cover */}
                <div style={{ height: 120, position: "relative" }}>
                  {group.cover_photo ? (
                    <img
                      src={group.cover_photo}
                      alt={group.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const p = (e.target as HTMLImageElement).parentElement; if (p) p.style.background = bgColor; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: bgColor }}>
                      <span style={{ fontSize: 32 }}>{emoji}</span>
                    </div>
                  )}
                  {/* Type badge */}
                  <span style={{
                    position: "absolute", top: 8, left: 8,
                    background: badge.bg, color: badge.color,
                    fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12,
                  }}>
                    {badge.label}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1E3A5F", marginBottom: 4 }} className="truncate">{group.name}</h3>

                  <div className="flex items-center gap-3 mb-2" style={{ fontSize: 12, color: "#94A3B8" }}>
                    <span>👥 {group.member_count}</span>
                    {lastPostDate && <span>{language === "tr" ? "Son gönderi" : "Last post"}: {timeAgo(lastPostDate)}</span>}
                  </div>

                  {group.description && (
                    <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {group.description}
                    </p>
                  )}

                  <Button
                    size="sm"
                    className="w-full mt-3"
                    variant={isJoined ? "secondary" : isPending ? "outline" : "default"}
                    disabled={isJoined || isPending || group.group_type === "private" || joinMutation.isPending}
                    onClick={(e) => { e.stopPropagation(); handleJoin(group); }}
                    style={!isJoined && !isPending && group.group_type !== "private" ? { background: "#1E3A5F", color: "#fff", border: "none", fontSize: 12 } : { fontSize: 12 }}
                  >
                    {isJoined ? t("groups.member", "✓ Member") : isPending ? t("groups.pending", "⏳ Pending") : group.group_type === "request" ? t("groups.send_request", "Request") : group.group_type === "private" ? t("groups.invite_only", "Invite Only") : t("groups.join", "Join")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Create Group Form ───
function CreateGroupForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { options: groupCats } = useAppOptions("group_categories");
  const CATEGORIES = useMemo(() => groupCats.map((o) => ({ key: o.value, label: o.label, emoji: o.emoji || "🌟" })), [groupCats]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const GROUP_TYPES = [
    { key: "public", label: t("groups.type.public", "Public"), desc: t("groups.type.public_desc", "Anyone can join"), icon: GlobeIcon, color: "#16A34A" },
    { key: "request", label: t("groups.type.request", "Request Required"), desc: t("groups.type.request_desc", "Admin approves"), icon: UserPlus, color: "#D97706" },
    { key: "private", label: t("groups.type.private", "Private"), desc: t("groups.type.private_desc", "Invite only"), icon: Lock, color: "#1E3A5F" },
  ];

  const [form, setForm] = useState({
    name: "", description: "", category: "", groupType: "", coverPhoto: "",
  });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("groups").upload(path, file, { upsert: true });
    if (error) { toast({ title: t("common.upload_failed", "Upload failed"), variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("groups").getPublicUrl(path);
    setForm(f => ({ ...f, coverPhoto: urlData.publicUrl }));
    setUploading(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (!form.name.trim()) throw new Error("Name is required");
      if (form.description.trim().length < 20) throw new Error("Description must be at least 20 characters");
      if (!form.category) throw new Error("Select a category");
      if (!form.groupType) throw new Error("Select a type");

      const { data: group, error } = await supabase.from("groups").insert({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        group_type: form.groupType,
        cover_photo: form.coverPhoto || null,
        created_by: user.id,
        member_count: 1,
      }).select("id").single();
      if (error) throw error;

      await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id, role: "owner" });
    },
    onSuccess: () => {
      toast({ title: t("groups.toast.created", "Group created!") });
      onSuccess();
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const canSubmit = form.name.trim() && form.description.trim().length >= 20 && form.category && form.groupType;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F", marginBottom: 20 }}>{t("groups.form.title", "Create New Group")}</h2>

      {/* Cover photo */}
      <div className="mb-4">
        {form.coverPhoto ? (
          <div style={{ position: "relative", height: 120, borderRadius: 12, overflow: "hidden" }}>
            <img src={form.coverPhoto} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setForm(f => ({ ...f, coverPhoto: "" }))} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full flex items-center justify-center gap-2 border-dashed border-2 rounded-xl" style={{ height: 80, borderColor: "#CBD5E1", color: "#94A3B8", fontSize: 13 }}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
              {uploading ? "Uploading..." : t("groups.form.add_cover", "Add Cover Photo")}
            </button>
          </>
        )}
      </div>

      {/* Name */}
      <div className="mb-4">
        <Label style={{ fontSize: 12, color: "#64748B" }}>{t("groups.form.name", "Group Name")} *</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("groups.form.name_placeholder", "e.g. Beyoğlu Book Club")} style={{ fontSize: 13 }} />
      </div>

      {/* Description */}
      <div className="mb-4">
        <Label style={{ fontSize: 12, color: "#64748B" }}>{t("common.description", "Description")} * <span style={{ color: "#94A3B8" }}>({t("groups.form.min_chars", "min 20 characters")})</span></Label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("groups.form.desc_placeholder", "What is the group about?")} rows={3} style={{ fontSize: 13 }} />
        <span style={{ fontSize: 11, color: form.description.length >= 20 ? "#16A34A" : "#94A3B8" }}>{form.description.length}/20</span>
      </div>

      {/* Category - tappable cards */}
      <div className="mb-4">
        <Label style={{ fontSize: 12, color: "#64748B", marginBottom: 8, display: "block" }}>{t("common.category", "Category")} *</Label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setForm(f => ({ ...f, category: c.key }))}
              className="flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all"
              style={{
                border: form.category === c.key ? "2px solid #1E3A5F" : "1px solid #E2E8F0",
                background: form.category === c.key ? "#EFF4FF" : "#fff",
                fontSize: 11, color: "#1E3A5F",
              }}
            >
              <span style={{ fontSize: 20 }}>{c.emoji}</span>
              <span style={{ fontWeight: form.category === c.key ? 600 : 400, lineHeight: 1.2, textAlign: "center", fontSize: 10 }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Type - tappable cards */}
      <div className="mb-5">
        <Label style={{ fontSize: 12, color: "#64748B", marginBottom: 8, display: "block" }}>{t("groups.form.type", "Group Type")} *</Label>
        <div className="grid grid-cols-3 gap-2">
          {GROUP_TYPES.map(gt => {
            const Icon = gt.icon;
            return (
              <button
                key={gt.key}
                onClick={() => setForm(f => ({ ...f, groupType: gt.key }))}
                className="flex flex-col items-center gap-1 rounded-xl py-3 transition-all"
                style={{
                  border: form.groupType === gt.key ? `2px solid ${gt.color}` : "1px solid #E2E8F0",
                  background: form.groupType === gt.key ? `${gt.color}10` : "#fff",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: gt.color }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: gt.color }}>{gt.label}</span>
                <span style={{ fontSize: 9, color: "#94A3B8" }}>{gt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!canSubmit || mutation.isPending}
        onClick={() => { if (!user) { navigate("/auth"); return; } mutation.mutate(); }}
        style={{ background: "#1E3A5F", color: "#fff", border: "none" }}
      >
        {mutation.isPending ? t("common.creating", "Creating...") : t("groups.create", "Create Group")}
      </Button>
    </div>
  );
}

export default Groups;
