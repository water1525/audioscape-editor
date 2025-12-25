import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "cixingnansheng" } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const STEPFUN_API_KEY = Deno.env.get("STEPFUN_API_KEY");
    if (!STEPFUN_API_KEY) {
      throw new Error("STEPFUN_API_KEY is not configured");
    }

    console.log("Calling Step TTS API with text:", text.substring(0, 50) + "...");

    const response = await fetch("https://api.stepfun.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "step-tts-2",
        input: text,
        voice: voice,
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Step TTS API error:", response.status, errorText);

      return new Response(
        JSON.stringify({
          error: `Step TTS API error: ${response.status} - ${errorText}`,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Step TTS API response received successfully");

    // Return the audio as binary
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error in step-tts function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
