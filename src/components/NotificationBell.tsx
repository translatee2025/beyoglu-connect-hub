import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Heart, MessageCircle, Mail, Calendar, Settings } from "lucide-react";

const typeIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  message: Mail,
  event_rsvp: Calendar,
  system: Settings,
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notification-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user && open,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["notification-count", user.id] });
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const handleClick = async (notif: any) => {
    if (!notif.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", notif.id);
      queryClient.invalidateQueries({ queryKey: ["notification-count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notification-count", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 rounded transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-0.5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <span className="font-medium text-xs text-foreground">{t("notifications.title", "Notifications")}</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xxs h-6" onClick={markAllRead}>
              {t("notifications.mark_all_read", "Mark all read")}
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center text-xs text-[#9CA3AF] py-8">{t("notifications.empty", "No notifications yet")}</p>
          ) : (
            notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Settings;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors border-b border-border last:border-b-0 ${!notif.read ? "bg-accent/30" : ""}`}
                >
                  <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{notif.body}</p>
                    <span className="text-xs text-[#9CA3AF]">{timeAgo(notif.created_at)}</span>
                  </div>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
