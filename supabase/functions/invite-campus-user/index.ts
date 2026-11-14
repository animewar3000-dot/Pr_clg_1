import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const appOrigin = Deno.env.get("APP_ORIGIN");
const corsHeaders = {
  "Access-Control-Allow-Origin": appOrigin ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const origin = req.headers.get("Origin");
  if (appOrigin && origin && origin !== appOrigin) return json({ error: "Origin not allowed." }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("invite-campus-user is missing server configuration.");
    return json({ error: "Invitations are not configured. Contact the project owner." }, 503);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sign in as a campus administrator." }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) return json({ error: "Your session is invalid. Sign in again." }, 401);

  let payload: Record<string, unknown>;
  try {
    const value = await req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return json({ error: "Request body must be a JSON object." }, 400);
    }
    payload = value as Record<string, unknown>;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const collegeCode = typeof payload.collegeCode === "string" ? payload.collegeCode.trim().toUpperCase() : "";
  const collegeStudentId = typeof payload.collegeStudentId === "string" ? payload.collegeStudentId.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  if (displayName.length < 2 || displayName.length > 100) {
    return json({ error: "Name must be between 2 and 100 characters." }, 400);
  }
  if (!collegeCode || collegeCode.length > 40 || !collegeStudentId || collegeStudentId.length > 80) {
    return json({ error: "College code and college student ID are required." }, 400);
  }

  const { data: profile, error: profileError } = await callerClient
    .from("profiles")
    .select("college_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.college_id) return json({ error: "Your campus profile is unavailable." }, 403);

  const { data: authorized, error: permissionError } = await callerClient.rpc(
    "can_manage_campus_users",
    { p_college_id: profile.college_id },
  );
  if (permissionError || authorized !== true) return json({ error: "Only college administrators can invite accounts." }, 403);

  const { data: college, error: collegeError } = await callerClient
    .from("colleges")
    .select("code")
    .eq("id", profile.college_id)
    .single();
  if (collegeError || String(college?.code ?? "").toUpperCase() !== collegeCode) {
    return json({ error: "You can only invite accounts into your own college." }, 403);
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const appUrl = Deno.env.get("APP_URL") ?? origin;
  const redirectTo = appUrl ? new URL("/auth/reset-password", appUrl).toString() : undefined;

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      display_name: displayName,
      college_code: collegeCode,
      college_student_id: collegeStudentId,
    },
    ...(redirectTo ? { redirectTo } : {}),
  });

  if (error || !data.user) {
    console.error("Campus invitation failed:", error?.message ?? "No user returned");
    return json({ error: error?.message ?? "The invitation could not be created." }, 400);
  }

  return json({ userId: data.user.id, email: data.user.email, invited: true }, 201);
});
