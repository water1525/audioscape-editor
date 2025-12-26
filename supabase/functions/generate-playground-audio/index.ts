import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define all playground TTS cases with their content
const playgroundCases = [
  {
    id: 1,
    filename: "playground-case-1.mp3",
    voice: "tianmeinvsheng",
    text: "各位观众朋友们，大家好！欢迎收看今日科技快讯。今天我们要报道一则重磅消息：阶跃星辰正式发布了全新的Step 3大语言模型，该模型在多项基准测试中取得了突破性成绩，在逻辑推理、代码生成和多语言理解等核心能力上均达到了业界领先水平，标志着国产大模型迈入了新的里程碑。",
  },
  {
    id: 2,
    filename: "playground-case-2.mp3",
    voice: "cixingnansheng",
    text: "午夜时分，老宅的钟声敲响了十二下。李探长站在书房门前，手中的手电筒微微颤抖。书架后面传来奇怪的响动，像是有人在翻动书页。他深吸一口气，推开了那扇尘封已久的暗门。眼前的景象让他倒吸一口凉气——墙上挂满了泛黄的照片，每一张都是同一个人，而那个人，三十年前就已经失踪了。",
  },
  {
    id: 3,
    filename: "playground-case-3.mp3",
    voice: "tianmeinvsheng",
    text: "您好，欢迎致电阶跃星辰客户服务中心，我是您的智能语音助理小星。很高兴为您服务！请问有什么可以帮助您的吗？您可以咨询产品功能、技术支持、账户问题或商务合作等事宜。我会尽我所能为您提供专业、高效的解答。如果需要转接人工客服，请随时告诉我。",
  },
  {
    id: 4,
    filename: "playground-case-4.mp3",
    voice: "cixingnansheng",
    text: "在这个瞬息万变的时代，我们始终相信科技的力量。阶跃星辰，以创新为引擎，以梦想为翼，致力于打造最前沿的人工智能技术。从语音合成到智能对话，从文本理解到多模态交互，我们用技术连接未来，让每一次交流都充满温度。阶跃星辰，与您一起，跨越星辰大海。",
  },
  {
    id: 5,
    filename: "playground-case-5.mp3",
    voice: "tianmeinvsheng",
    text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。这首《静夜思》是唐代诗人李白创作的一首脍炙人口的五言绝句。诗人通过描绘月夜思乡的场景，以简洁而深刻的语言，表达了游子对故乡的深切思念之情。全诗意境清幽，情感真挚，千百年来感动了无数漂泊在外的游子。",
  },
  {
    id: 6,
    filename: "playground-case-6.mp3",
    voice: "tianmeinvsheng",
    text: "亲爱的听众朋友，欢迎来到星辰夜话。在这个安静的夜晚，让我陪伴你度过这段温柔的时光。生活或许不总是一帆风顺，但请相信，每一个黎明都会带来新的希望。无论今天经历了什么，都请记得对自己温柔一些。闭上眼睛，深呼吸，让我的声音伴你入眠，祝你好梦。",
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

    if (!STEPFUN_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: Array<{ id: number; success: boolean; url?: string; error?: string }> = [];

    for (const caseItem of playgroundCases) {
      console.log(`Generating audio for case ${caseItem.id}: ${caseItem.text.substring(0, 30)}...`);

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
            input: caseItem.text,
            voice: caseItem.voice,
            response_format: "mp3",
            speed: 1.0,
          }),
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          throw new Error(`TTS API error: ${ttsResponse.status} - ${errorText}`);
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        console.log(`Audio generated for case ${caseItem.id}, size: ${audioBuffer.byteLength} bytes`);

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from("audio")
          .upload(`tts/${caseItem.filename}`, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("audio")
          .getPublicUrl(`tts/${caseItem.filename}`);

        results.push({
          id: caseItem.id,
          success: true,
          url: publicUrlData.publicUrl,
        });

        console.log(`Case ${caseItem.id} uploaded successfully`);

        // Delay to avoid rate limiting
        await sleep(1500);
      } catch (error) {
        console.error(`Error processing case ${caseItem.id}:`, error);
        results.push({
          id: caseItem.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
