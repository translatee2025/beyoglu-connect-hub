import { supabase } from "@/integrations/supabase/client";

export async function createNotification(params: {
  userId: string;
  type: string;
  body: string;
  link: string;
}) {
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    body: params.body,
    link: params.link,
  });
}

export async function getDisplayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.display_name || "Someone";
}

const ENTITY_TABLE_MAP: Record<string, string> = {
  wall_post: "wall_posts",
  classified: "classifieds",
  pet_post: "pet_posts",
  reel: "reels",
  help_post: "neighbor_help_posts",
};

export async function getContentOwnerId(
  entityType: string,
  entityId: string
): Promise<string | null> {
  const table = ENTITY_TABLE_MAP[entityType];
  if (!table) return null;
  const { data } = await supabase
    .from(table as any)
    .select("user_id")
    .eq("id", entityId)
    .maybeSingle();
  return (data as any)?.user_id || null;
}

const ENTITY_LINK_MAP: Record<string, string> = {
  wall_post: "/wall",
  classified: "/classifieds",
  pet_post: "/pets",
  reel: "/reels",
  help_post: "/help",
};

export function getEntityLink(entityType: string): string {
  return ENTITY_LINK_MAP[entityType] || "/";
}
