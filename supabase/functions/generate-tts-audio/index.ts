import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// case1 and case2 single audio
const singleAudioConfigs = [
  {
    id: "case1",
    filename: "case1.mp3",
    text: "阶跃星辰近日正式发布新一代基础大模型Step 3，兼顾智能与效率，面向推理时代打造最适合应用的模型。Step 3将面向全球企业和开发者开源，为开源世界贡献最强多模态推理模型。",
    voice: "cixingnansheng",
  },
  {
    id: "case2",
    filename: "case2.mp3",
    text: "深夜，老宅的钟敲响十二下。她推开尘封的阁楼门，发现一封泛黄的信——收件人竟是自己的名字，落款日期却是明天。信上只有一句话：不要回头。她的心跳骤然加速，身后传来轻微的脚步声。她屏住呼吸，缓缓转身，却只看见空荡荡的走廊和一面落满灰尘的镜子。镜中的自己正微笑着，但她此刻分明没有笑。",
    voice: "tianmeinvsheng",
  },
];

// case3 dialogue lines
const dialogueConfigs = [
  { id: "dialogue-0", filename: "dialogue-0.mp3", text: "您好，欢迎致电智能客服中心，请问有什么可以帮您？", voice: "tianmeinvsheng" },
  { id: "dialogue-1", filename: "dialogue-1.mp3", text: "你好，我昨天下的订单显示已发货，但物流信息一直没更新。", voice: "cixingnansheng" },
  { id: "dialogue-2", filename: "dialogue-2.mp3", text: "好的，请您提供一下订单号，我帮您查询。", voice: "tianmeinvsheng" },
  { id: "dialogue-3", filename: "dialogue-3.mp3", text: "订单号是202412250001。", voice: "cixingnansheng" },
  { id: "dialogue-4", filename: "dialogue-4.mp3", text: "已查到，您的包裹目前在转运中，预计明天送达，请您耐心等待。", voice: "tianmeinvsheng" },
  { id: "dialogue-5", filename: "dialogue-5.mp3", text: "好的，谢谢！", voice: "cixingnansheng" },
];

const allConfigs = [...singleAudioConfigs, ...dialogueConfigs];

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

    for (const config of allConfigs) {
      console.log(`Generating audio for ${config.id}...`);

      try {
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

        const { data, error } = await supabase.storage
          .from("audio")
          .upload(`tts/${config.filename}`, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });

        if (error) {
          console.error(`Upload failed for ${config.id}:`, error);
          results.push({ id: config.id, success: false, error: error.message });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("audio")
          .getPublicUrl(`tts/${config.filename}`);

        console.log(`✓ ${config.id} uploaded: ${urlData.publicUrl}`);
        results.push({ id: config.id, success: true, url: urlData.publicUrl });

        await sleep(1500);
      } catch (error) {
        console.error(`Error processing ${config.id}:`, error);
        results.push({ id: config.id, success: false, error: String(error) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`Generation complete: ${successCount}/${allConfigs.length} successful`);

    return new Response(
      JSON.stringify({
        success: successCount === allConfigs.length,
        results,
        message: `Generated ${successCount}/${allConfigs.length} audio files`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-tts-audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
