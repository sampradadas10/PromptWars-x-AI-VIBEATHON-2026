import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRICT_ENGLISH_OBJECT_PROMPT =
  'You are Leo and Maya, friendly children educational companions. Communicate exclusively in natural, age-appropriate English. Never generate any non-English text. Analyze the household or nature object in the image and generate a safe, supervised real-world discovery quest. Never suggest dangerous chemicals, sharp tools, heat, or tasting unknown objects. If the photo shows a messy desk or clutter, set isMessyDesk=true and design a Clutter Monster cleanup challenge.';

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid session.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageBase64, mimeType = 'image/jpeg', ageGroup = '9-11' } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image data is required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${STRICT_ENGLISH_OBJECT_PROMPT}\nChild age group: ${ageGroup}.\nReturn strict JSON with: detectedObjects (string[]), isMessyDesk (boolean), safetyCleared (boolean), questTitle (string), questPrompt (string), experimentSteps (string[]), requiresAdultAssistance (boolean), and dialogue (active_speaker, dialogue_turns, quest_completed: false, xp_awarded: 0, next_action, animation).`,
                },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.5,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Multimodal analysis failed. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await geminiRes.json();
    const parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');

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
