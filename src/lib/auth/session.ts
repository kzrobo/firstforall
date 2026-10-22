import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TeamRole = "super_admin" | "editor";
export interface TeamSession { userId: string; email: string | null; role: TeamRole; canPublish: boolean }

/** Server-side role lookup. Never trust client-side state for authorization. */
export async function getTeamSession(): Promise<TeamSession | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("team_members").select("role, can_publish").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { userId: user.id, email: user.email ?? null, role: data.role, canPublish: data.role === "super_admin" || data.can_publish };
}
