import { useMemo, useState } from "react";
import { Users, Lock, Globe as GlobeIcon, UserPlus, Plus, Search } from "lucide-react";
import { MediaUpload } from "@/components/shared/MediaUpload";
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
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";

type OptionItem = {
  key: string;
  translationKey: string;
  fallback: string;
};

type GroupOptions = {
  categories: OptionItem[];
  groupTypes: OptionItem[];
  neighborhoods: OptionItem[];
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  group_type: string;
  neighborhood: string | null;
  member_count: number;
};

const DEFAULT_GROUP_OPTIONS: GroupOptions = {
  categories: [
    { key: "community", translationKey: "groups.category.community", fallback: "Community" },
    { key: "food-dining", translationKey: "groups.category.food-dining", fallback: "Food & Dining" },
    { key: "education", translationKey: "groups.category.education", fallback: "Education" },
    { key: "arts-culture", translationKey: "groups.category.arts-culture", fallback: "Arts & Culture" },
    { key: "sports", translationKey: "groups.category.sports", fallback: "Sports" },
    { key: "pets", translationKey: "groups.category.pets", fallback: "Pets" },
    { key: "family", translationKey: "groups.category.family", fallback: "Family" },
    { key: "business", translationKey: "groups.category.business", fallback: "Business & Networking" },
    { key: "other", translationKey: "groups.category.other", fallback: "Other" },
  ],
  groupTypes: [
    { key: "public", translationKey: "groups.type.public", fallback: "Public" },
    { key: "request", translationKey: "groups.type.request", fallback: "Request" },
    { key: "private", translationKey: "groups.type.private", fallback: "Private" },
  ],
  neighborhoods: [
    { key: "beyoglu", translationKey: "groups.neighborhood.beyoglu", fallback: "Beyoğlu" },
    { key: "cihangir", translationKey: "groups.neighborhood.cihangir", fallback: "Cihangir" },
    { key: "galata", translationKey: "groups.neighborhood.galata", fallback: "Galata" },
    { key: "tophane", translationKey: "groups.neighborhood.tophane", fallback: "Tophane" },
    { key: "firuzaga", translationKey: "groups.neighborhood.firuzaga", fallback: "Firuzağa" },
    { key: "asmalimescit", translationKey: "groups.neighborhood.asmalimescit", fallback: "Asmalımescit" },
    { key: "taksim", translationKey: "groups.neighborhood.taksim", fallback: "Taksim" },
    { key: "tomtom", translationKey: "groups.neighborhood.tomtom", fallback: "Tomtom" },
    { key: "istiklal", translationKey: "groups.neighborhood.istiklal", fallback: "İstiklal" },
    { key: "other", translationKey: "groups.neighborhood.other", fallback: "Other" },
  ],
};

const legacyCategoryMap: Record<string, string> = {
  Community: "community",
  "Food & Dining": "food-dining",
  Education: "education",
  "Arts & Culture": "arts-culture",
  Sports: "sports",
  Pets: "pets",
  Family: "family",
  Other: "other",
};

const normalizeCategory = (value: string) => legacyCategoryMap[value] || value;
const normalizeGroupType = (value: string) => value || "public";

const Groups = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [postOpen, setPostOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: groupOptions = DEFAULT_GROUP_OPTIONS } = useQuery({
    queryKey: ["groups-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "groups_options")
        .maybeSingle();
      if (error) throw error;
      if (!data?.value || typeof data.value !== "object") return DEFAULT_GROUP_OPTIONS;
      return data.value as unknown as GroupOptions;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name, description, category, group_type, neighborhood, member_count")
        .order("member_count", { ascending: false });
      if (error) throw error;
      return (data || []).map((group) => ({
        ...group,
        category: normalizeCategory(group.category),
        group_type: normalizeGroupType(group.group_type),
      })) as GroupRow[];
    },
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["group-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const membershipMap = useMemo(
    () => new Map(memberships.map((membership) => [membership.group_id, membership.role])),
    [memberships],
  );

  const filtered = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      (group.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || group.category === category;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "public":
        return <GlobeIcon className="w-4 h-4" />;
      case "request":
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const option = groupOptions.groupTypes.find((item) => item.key === type);
    return option ? t(option.translationKey, option.fallback) : type;
  };

  const getCategoryLabel = (value: string) => {
    const option = groupOptions.categories.find((item) => item.key === value);
    return option ? t(option.translationKey, option.fallback) : value;
  };

  const getNeighborhoodLabel = (value: string | null) => {
    if (!value) return "";
    const option = groupOptions.neighborhoods.find((item) => item.key === value);
    return option ? t(option.translationKey, option.fallback) : value;
  };

  const joinMutation = useMutation({
    mutationFn: async (group: GroupRow) => {
      if (!user) throw new Error(t("groups.auth_required", "Please log in to join groups"));

      if (group.group_type === "private") {
        throw new Error(t("groups.private_only", "This group is invite only"));
      }

      const role = group.group_type === "request" ? "pending" : "member";
      const { error: membershipError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role,
      });
      if (membershipError) throw membershipError;

      if (role === "member") {
        const { error: updateError } = await supabase
          .from("groups")
          .update({ member_count: group.member_count + 1 })
          .eq("id", group.id);
        if (updateError) throw updateError;
      }
    },
    onSuccess: async (_data, group) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
        queryClient.invalidateQueries({ queryKey: ["group-memberships", user?.id] }),
      ]);
      toast({
        title:
          group.group_type === "request"
            ? t("groups.toast.request_sent", "Join request sent")
            : t("groups.toast.joined", "You joined the group"),
      });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  const handleJoin = (group: GroupRow) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (membershipMap.has(group.id)) return;
    joinMutation.mutate(group);
  };

  const categoryTabs = [
    { key: "all", label: t("groups.category.all", "All") },
    ...groupOptions.categories.map((item) => ({ key: item.key, label: t(item.translationKey, item.fallback) })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">
              {t("groups.title", "Community Groups")}
            </h1>
            <p className="text-muted-foreground">
              {t("groups.subtitle", "Join groups to connect with neighbors who share your interests")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("groups.search_placeholder", "Search groups...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> {t("groups.create_button", "Create Group")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <GroupForm
                  groupOptions={groupOptions}
                  onSuccess={() => {
                    setPostOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["groups"] });
                    queryClient.invalidateQueries({ queryKey: ["group-memberships", user?.id] });
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categoryTabs.map((tab) => (
              <Button
                key={tab.key}
                variant={category === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t("groups.loading", "Loading groups...")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("groups.empty_title", "No groups found")}</h3>
              <p className="text-muted-foreground">{t("groups.empty_description", "Create the first group!")}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filtered.map((group) => {
                const membershipRole = membershipMap.get(group.id);
                const isJoined = membershipRole === "owner" || membershipRole === "member";
                const isPending = membershipRole === "pending";

                return (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-xl truncate">{group.name}</CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                {getTypeIcon(group.group_type)}
                                <span>{getTypeLabel(group.group_type)}</span>
                              </Badge>
                              <Badge variant="outline">{getCategoryLabel(group.category)}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {group.member_count} {t("groups.members", "members")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {(group.description || group.neighborhood) && (
                        <CardDescription className="mt-3 space-y-2">
                          {group.description && <span className="block">{group.description}</span>}
                          {group.neighborhood && (
                            <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                              {t("groups.neighborhood_label", "Neighborhood")}: {getNeighborhoodLabel(group.neighborhood)}
                            </span>
                          )}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant={isJoined || isPending ? "secondary" : "outline"}
                        className="w-full"
                        disabled={isJoined || isPending || group.group_type === "private" || joinMutation.isPending}
                        onClick={() => handleJoin(group)}
                      >
                        {isJoined
                          ? t("groups.action.joined", "Joined")
                          : isPending
                            ? t("groups.action.requested", "Requested")
                            : group.group_type === "request"
                              ? t("groups.action.request", "Request to Join")
                              : group.group_type === "private"
                                ? t("groups.action.private", "Invite Only")
                                : t("groups.action.join", "Join Group")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GroupForm = ({
  onSuccess,
  groupOptions,
}: {
  onSuccess: () => void;
  groupOptions: GroupOptions;
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: groupOptions.categories[0]?.key || "community",
    groupType: groupOptions.groupTypes[0]?.key || "public",
    neighborhood: groupOptions.neighborhoods[0]?.key || "beyoglu",
    coverPhoto: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t("groups.auth_required_create", "Please log in to create a group"));

      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category,
          group_type: form.groupType,
          neighborhood: form.neighborhood,
          cover_photo: form.coverPhoto || null,
          created_by: user.id,
          member_count: 1,
        })
        .select("id")
        .single();

      if (error) throw error;

      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) throw memberError;
    },
    onSuccess: () => {
      toast({ title: t("groups.toast.created", "Group created") });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error", "Error"), description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{t("groups.form.title", "Create a Group")}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("groups.form.name_label", "Group Name")}</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("groups.form.name_placeholder", "e.g. Beyoğlu Book Club")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("groups.form.category_label", "Category")}</Label>
          <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t("groups.form.category_placeholder", "Select category")}></SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groupOptions.categories.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {t(item.translationKey, item.fallback)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("groups.form.type_label", "Type")}</Label>
          <Select value={form.groupType} onValueChange={(value) => setForm({ ...form, groupType: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t("groups.form.type_placeholder", "Select type")}></SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groupOptions.groupTypes.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {t(item.translationKey, item.fallback)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("groups.form.neighborhood_label", "Neighborhood")}</Label>
          <Select value={form.neighborhood} onValueChange={(value) => setForm({ ...form, neighborhood: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t("groups.form.neighborhood_placeholder", "Select neighborhood")}></SelectValue>
            </SelectTrigger>
            <SelectContent>
              {groupOptions.neighborhoods.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {t(item.translationKey, item.fallback)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("groups.form.description_label", "Description")}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t("groups.form.description_placeholder", "What is this group about?")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("groups.form.cover_photo", "Cover Photo")}</Label>
          <MediaUpload value={form.coverPhoto ? [form.coverPhoto] : []} onChange={(urls) => setForm({ ...form, coverPhoto: urls[0] || "" })} maxFiles={1} label={t("groups.form.add_cover", "Add Cover Photo")} />
        </div>

        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}>
          {mutation.isPending ? t("groups.form.submitting", "Creating...") : t("groups.form.submit", "Create Group")}
        </Button>
      </div>
    </div>
  );
};

export default Groups;
