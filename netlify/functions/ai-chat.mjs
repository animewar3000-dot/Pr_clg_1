const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 6000;

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });

  const apiKey = process.env.GROQ_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!apiKey) return Response.json({ error: 'Robo is not configured yet. The administrator must add GROQ_API_KEY to Netlify environment variables.' }, { status: 503, headers });
  if (!supabaseUrl || !supabaseAnonKey) return Response.json({ error: 'Campus authentication is not configured on the server.' }, { status: 503, headers });

  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return Response.json({ error: 'Please sign in to use Robo.' }, { status: 401, headers });

  try {
    const identity = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: auth },
    });
    if (!identity.ok) return Response.json({ error: 'Your session is invalid or expired. Please sign in again.' }, { status: 401, headers });

    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
      return Response.json({ error: 'Send between 1 and 20 recent messages.' }, { status: 400, headers });
    }
    const messages = body.messages.map((message) => {
      if (!['user', 'assistant'].includes(message?.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > MAX_CONTENT_LENGTH) {
        throw new Error('Each message must contain a valid role and text under 6,000 characters.');
      }
      return { role: message.role, content: message.content.trim() };
    });
    if (messages[messages.length - 1].role !== 'user') return Response.json({ error: 'The latest message must be from you.' }, { status: 400, headers });

    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.55,
        max_tokens: 900,
        messages: [
          { role: 'system', content: 'You are Robo, the friendly AI campus companion inside CampOS. Help students with studying, programming, campus life, and productivity. Be warm, concise, practical, and honest. Never claim access to private campus records, schedules, messages, or documents unless they are explicitly provided in the conversation. Do not invent college policies, deadlines, or announcements. For urgent safety or medical issues, direct the student to qualified local help.' },
          ...messages,
        ],
      }),
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = upstream.status === 429 ? 'Robo is receiving too many requests. Please wait a moment and try again.' : 'Groq could not complete that request. Please try again.';
      return Response.json({ error: message }, { status: upstream.status === 429 ? 429 : 502, headers });
    }
    const answer = result.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) return Response.json({ error: 'Robo returned an empty response. Please try again.' }, { status: 502, headers });
    return Response.json({ message: answer.trim(), model: MODEL }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to process the chat request.' }, { status: 400, headers });
  }
};