import { supabase } from "./supabase.js";

export function mapUser(profile, authUser = null) {
  const created = profile?.created_at || authUser?.created_at || new Date().toISOString();
  const updated = profile?.updated_at || created;
  return {
    id: profile?.id || authUser?.id,
    name: profile?.name || authUser?.user_metadata?.name || authUser?.email?.split("@")[0] || "User",
    email: profile?.email || authUser?.email,
    avatarUrl: profile?.avatar_url || authUser?.user_metadata?.avatar_url || undefined,
    role: profile?.role || "Owner",
    status: profile?.status || "active",
    lastActiveAt: profile?.last_active_at || updated,
    createdAt: created,
    updatedAt: updated,
  };
}

export async function ensureProfile(authUser) {
  const now = new Date().toISOString();
  const name = authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User";
  const profile = {
    id: authUser.id,
    email: authUser.email,
    name,
    role: "Owner",
    status: "active",
    last_active_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("app_users")
    .upsert(profile, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication token is required." },
        timestamp: new Date().toISOString(),
      });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Invalid or expired token." },
        timestamp: new Date().toISOString(),
      });
    }

    const profile = await ensureProfile(data.user);
    req.authToken = token;
    req.authUser = data.user;
    req.user = profile;
    next();
  } catch (err) {
    next(err);
  }
}
