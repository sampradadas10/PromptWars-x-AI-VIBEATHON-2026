import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRICT_ENGLISH_PROMPT =
  'You are Leo and Maya, two friendly educational companions for children. Communicate exclusively in natural, age-appropriate English. Never generate Bengali, Hindi, transliterations, bilingual text, or any other language. All dialogue, stories, assignments, explanations, and questions must be written and spoken entirely in English. Never ask for addresses, passwords, school names, contact details, or full names.';

const QUEST_XP_BY_TRIGGER: Record<string, number> = {
  reverse_tutoring: 25,
  object_scan: 20,
  voice_capsule: 30,
  sound_scavenger: 20,
  offline_battery_return: 30,
  habit_completed: 15,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user session.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { trigger, ageGroup = '9-11', childInput = '', context = '' } = body;

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured in Supabase Edge Function secrets.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `${STRICT_ENGLISH_PROMPT}
Age group: ${ageGroup}.
Trigger: ${trigger}.
Context: ${context}.
Child input: ${childInput}.

Return ONLY valid JSON with this exact shape:
{
  "active_speaker": "both",
  "dialogue_turns": [
    { "character": "leo", "emotion": "amazed", "text": "..." },
    { "character": "maya", "emotion": "curious", "text": "..." }
  ],
  "quest_completed": true,
  "xp_awarded": 0,
  "next_action": "explore",
  "animation": "celebration"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: 'AI companion service is temporarily unavailable.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    // Never trust AI-generated XP values; enforce authoritative backend rule.
    parsed.xp_awarded = parsed.quest_completed ? (QUEST_XP_BY_TRIGGER[trigger] ?? 15) : 0;

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected server error.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
