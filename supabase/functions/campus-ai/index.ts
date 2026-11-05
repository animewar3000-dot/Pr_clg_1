import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const groqKey = Deno.env.get("GROQ_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!groqKey || !supabaseUrl || !anonKey) {
    console.error("Missing required server configuration for campus-ai.");
    return json({ error: "The AI service is not configured yet. Please contact your campus administrator." }, 503);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Your session is invalid. Please sign in again." }, 401);

  let payload: { messages?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0 || payload.messages.length > 12) {
    return json({ error: "Send between 1 and 12 recent messages." }, 400);
  }

  const messages = payload.messages.map((message: unknown) => {
    if (!message || typeof message !== "object") return null;
    const item = message as { role?: unknown; content?: unknown };
    if (!["user", "assistant"].includes(String(item.role))) return null;
    if (typeof item.content !== "string" || !item.content.trim() || item.content.length > 4000) return null;
    return { role: item.role as "user" | "assistant", content: item.content.trim() };
  });

  if (messages.some((message) => message === null)) {
    return json({ error: "One or more messages are invalid or too long." }, 400);
  }
  const conversation = messages as { role: "user" | "assistant"; content: string }[];
  if (conversation[conversation.length - 1]?.role !== "user") {
    return json({ error: "The latest message must be from the student." }, 400);
  }

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-20b",
        temperature: 0.4,
        max_completion_tokens: 700,
        messages: [
          {
            role: "system",
            content: "You are CampOS AI Assistant, a helpful assistant for college students. Help with study planning, general academic concepts, and navigating campus life. Be concise, clear, and respectful. Never invent college-specific schedules, policies, contacts, announcements, room details, or services. You do not currently have access to the college's live records or official documents; clearly say so and direct the student to an official campus source when a question depends on them. Do not claim to perform actions in CampOS.",
          },
          ...conversation,
        ],
      }),
    });

    if (!groqResponse.ok) {
      const providerError = await groqResponse.text();
      console.error("Groq request failed:", groqResponse.status, providerError.slice(0, 500));
      return json({ error: "The AI provider could not complete this request. Please try again shortly." }, 502);
    }

    const result = await groqResponse.json();
    const message = result.choices?.[0]?.message?.content;
    if (typeof message !== "string" || !message.trim()) {
      return json({ error: "The AI provider returned an empty response." }, 502);
    }

    return json({ message: message.trim(), model: result.model ?? Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-20b" });
  } catch (error) {
    console.error("campus-ai error:", error);
    return json({ error: "Unable to reach the AI service right now. Please try again." }, 502);
  }
});
