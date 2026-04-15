import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Flag, Eye, EyeOff, AlertTriangle, Ban, X } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  wall_post: "bg-blue-500",
  classified: "bg-green-500",
  venue: "bg-purple-500",
  user: "bg-orange-500",
  event: "bg-pink-500",
};

const TABLE_MAP: Record<string, { table: string; field: string }> = {
  wall_post: { table: "wall_posts", field: "content" },
  classified: { table: "classifieds", field: "title" },
  venue: { table: "venues", field: "name" },
  user: { table: "profiles", field: "display_name" },
  event: { table: "events", field: "title" },
};

const AdminReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (!data?.length) return [];

      // Hydrate reporter names
      const reporterIds = [...new Set(data.map((r) => r.reporter_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", reporterIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

      // Hydrate content previews
      const enriched = await Promise.all(
        data.map(async (report) => {
          let preview = "";
          let contentOwnerId: string | null = null;
          const mapping = TABLE_MAP[report.content_type];
          if (mapping) {
            const idCol = report.content_type === "user" ? "user_id" : "id";
            const { data: row } = await supabase
              .from(mapping.table as any)
              .select(`${mapping.field}, ${report.content_type === "user" ? "user_id" : "user_id, id"}`)
              .eq(idCol, report.content_id)
              .maybeSingle();
            if (row) {
              preview = String((row as any)[mapping.field] || "").slice(0, 80);
              contentOwnerId = report.content_type === "user"
                ? report.content_id
                : (row as any).user_id || null;
            }
          }
          return {
            ...report,
            reporterName: profileMap.get(report.reporter_id) || "Unknown",
            preview,
            contentOwnerId,
          };
        })
      );
      return enriched;
    },
  });

  const actionReport = useMutation({
    mutationFn: async (params: { reportId: string; action: string; report: any }) => {
      const { reportId, action, report } = params;

      if (action === "dismiss") {
        await supabase.from("reports").update({ status: "dismissed", updated_at: new Date().toISOString() }).eq("id", reportId);
      }

      if (action === "hide") {
        const ct = report.content_type;
        if (ct === "wall_post") {
          await supabase.from("wall_posts").update({ status: "hidden" } as any).eq("id", report.content_id);
        } else if (ct === "classified") {
          await supabase.from("classifieds").update({ status: "closed" as any }).eq("id", report.content_id);
        } else if (ct === "venue") {
          await supabase.from("venues").update({ is_verified: false }).eq("id", report.content_id);
        } else if (ct === "event") {
          await supabase.from("events").update({ status: "deleted" }).eq("id", report.content_id);
        }
        await supabase.from("reports").update({ status: "actioned", actioned_by: user!.id, updated_at: new Date().toISOString() }).eq("id", reportId);
      }

      if (action === "warn" && report.contentOwnerId) {
        await supabase.from("notifications").insert({
          user_id: report.contentOwnerId,
          type: "system",
          body: "Your content was flagged and reviewed by our moderation team.",
          read: false,
        });
        toast({ title: "Warning sent" });
      }

      if (action === "ban" && report.contentOwnerId) {
        // Upsert banned role
        const { data: existing } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", report.contentOwnerId)
          .maybeSingle();
        if (existing) {
          await supabase.from("user_roles").update({ role: "banned" as any }).eq("id", existing.id);
        } else {
          await supabase.from("user_roles").insert({ user_id: report.contentOwnerId, role: "banned" as any });
        }
        await supabase.from("reports").update({ status: "actioned", actioned_by: user!.id, updated_at: new Date().toISOString() }).eq("id", reportId);
        toast({ title: "User banned" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const getViewLink = (report: any) => {
    switch (report.content_type) {
      case "wall_post": return "/wall";
      case "classified": return "/classifieds";
      case "venue": return `/venue/${report.content_id}`;
      case "user": return `/profile/${report.content_id}`;
      case "event": return `/events/${report.content_id}`;
      default: return "/";
    }
  };

  if (isLoading) return <div className="text-muted-foreground py-8 text-center">Loading reports...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Flag className="w-6 h-6 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <Badge variant="secondary">{reports.length} pending</Badge>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No pending reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => (
            <Card key={report.id}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium text-white ${TYPE_COLORS[report.content_type] || "bg-gray-500"}`}>
                        {report.content_type}
                      </span>
                      <span className="text-sm text-foreground font-medium truncate">{report.preview || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Reported by: <strong>{report.reporterName}</strong></span>
                      <span>Reason: <strong>{report.reason}</strong></span>
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(getViewLink(report), "_blank")}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => actionReport.mutate({ reportId: report.id, action: "hide", report })}>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => actionReport.mutate({ reportId: report.id, action: "warn", report })}>
                      <AlertTriangle className="w-3.5 h-3.5" /> Warn
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => actionReport.mutate({ reportId: report.id, action: "ban", report })}>
                      <Ban className="w-3.5 h-3.5" /> Ban
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => actionReport.mutate({ reportId: report.id, action: "dismiss", report })}>
                      <X className="w-3.5 h-3.5" /> Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
