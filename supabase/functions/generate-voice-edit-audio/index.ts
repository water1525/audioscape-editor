import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STEPFUN_API_KEY = Deno.env.get("STEPFUN_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STEPFUN_API_KEY) {
      throw new Error("STEPFUN_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 星星人冒险相关的文案，约10秒朗读时长
    const text = "在遥远的星空中，住着一群可爱的星星人。他们每天都在银河里冒险，寻找神秘的星尘宝藏。今天，小星星决定踏上一段全新的旅程，去探索那片从未有人到达过的星云深处。";

    console.log("Generating 星星人冒险 audio...");

    const response = await fetch("https://api.stepfun.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "step-tts-2",
        input: text,
        voice: "cixingnansheng",
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Step TTS API error:", response.status, errorText);
      throw new Error(`Step TTS API error: ${response.status}`);
    }

    console.log("Audio generated successfully, uploading to storage...");

    const audioBuffer = await response.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload("voice-edit/xinxingren-maoxian.mp3", audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    console.log("星星人冒险 audio uploaded successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "星星人冒险音频生成成功",
        text: text
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
