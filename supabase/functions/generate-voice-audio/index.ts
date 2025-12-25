import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const audioConfigs = [
  {
    id: "cila-original",
    filename: "cila-original.mp3",
    text: "大家好，我是Cila，很高兴认识你。今天天气真不错，希望你有愉快的一天！",
    voice: "tianmeinvsheng",
  },
  {
    id: "cila-cloned",
    filename: "cila-cloned.mp3",
    text: "欢迎使用阶跃星辰语音合成平台，我是Cila，这是通过AI技术复刻我声音生成的语音。",
    voice: "tianmeinvsheng",
  },
  {
    id: "john-original",
    filename: "john-original.mp3",
    text: "你好，我是John，欢迎来到我们的语音平台。让我为你展示一下语音合成的魅力。",
    voice: "cixingnansheng",
  },
  {
    id: "john-cloned",
    filename: "john-cloned.mp3",
    text: "你好，这是通过Step-tts-2模型复刻我的声音生成的语音，听起来和原声一样自然。",
    voice: "cixingnansheng",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results: Array<{ id: string; success: boolean; url?: string; error?: string }> = [];

    for (const config of audioConfigs) {
      console.log(`Generating audio for ${config.id}...`);

      try {
        // Generate TTS audio
        const ttsResponse = await fetch("https://api.stepfun.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STEPFUN_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "step-tts-2",
            input: config.text,
            voice: config.voice,
            response_format: "mp3",
            speed: 1.0,
          }),
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error(`TTS failed for ${config.id}:`, errorText);
          results.push({ id: config.id, success: false, error: `TTS API error: ${ttsResponse.status}` });
          continue;
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        console.log(`Audio generated for ${config.id}, size: ${audioBuffer.byteLength} bytes`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("audio")
          .upload(`voice-clone/${config.filename}`, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });

        if (error) {
          console.error(`Upload failed for ${config.id}:`, error);
          results.push({ id: config.id, success: false, error: error.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("audio")
          .getPublicUrl(`voice-clone/${config.filename}`);

        console.log(`✓ ${config.id} uploaded successfully: ${urlData.publicUrl}`);
        results.push({ id: config.id, success: true, url: urlData.publicUrl });

        // Wait between requests to avoid rate limiting
        await sleep(1500);
      } catch (error) {
        console.error(`Error processing ${config.id}:`, error);
        results.push({ id: config.id, success: false, error: String(error) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`Generation complete: ${successCount}/${audioConfigs.length} successful`);

    return new Response(
      JSON.stringify({
        success: successCount === audioConfigs.length,
        results,
        message: `Generated ${successCount}/${audioConfigs.length} audio files`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-voice-audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
