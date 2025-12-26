import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, sampleText, targetText } = await req.json();

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "Audio data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!targetText) {
      return new Response(JSON.stringify({ error: "Target text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const STEPFUN_API_KEY = Deno.env.get("STEPFUN_API_KEY");
    if (!STEPFUN_API_KEY) {
      throw new Error("STEPFUN_API_KEY is not configured");
    }

    console.log("Starting voice cloning process...");

    // Step 1: Upload the audio file
    console.log("Step 1: Uploading audio file...");
    
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    
    // Create form data for file upload
    const formData = new FormData();
    const audioBlob = new Blob([binaryData], { type: "audio/wav" });
    formData.append("file", audioBlob, "recording.wav");
    formData.append("purpose", "storage");

    const uploadResponse = await fetch("https://api.stepfun.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("File upload error:", uploadResponse.status, errorText);
      throw new Error(`Failed to upload audio file: ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const fileId = uploadResult.id;
    console.log("File uploaded successfully, file_id:", fileId);

    // Step 2: Create cloned voice with retry
    // Note: We don't pass the 'text' parameter to let the API use its built-in ASR
    // This is more forgiving when users don't read the exact sample text
    console.log("Step 2: Creating cloned voice with step-tts-mini...");
    
    let voiceResult;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      const voiceResponse = await fetch("https://api.stepfun.com/v1/audio/voices", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STEPFUN_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: fileId,
          model: "step-tts-mini",
          // Omit 'text' to let API use ASR for better tolerance
        }),
      });

      if (voiceResponse.ok) {
        voiceResult = await voiceResponse.json();
        break;
      }
      
      const errorText = await voiceResponse.text();
      console.error(`Voice cloning attempt ${retryCount + 1} error:`, voiceResponse.status, errorText);
      
      if (voiceResponse.status === 503 && retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying voice cloning (${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        continue;
      }
      
      // If it's a 503 error, provide a friendlier message
      if (voiceResponse.status === 503) {
        throw new Error("服务暂时繁忙，请稍后重试");
      }
      
      throw new Error(`音色复刻失败: ${errorText}`);
    }
    
    if (!voiceResult) {
      throw new Error("服务暂时繁忙，请稍后重试");
    }

    const voiceId = voiceResult.id;
    console.log("Voice cloned successfully, voice_id:", voiceId);

    // Step 3: Generate audio with cloned voice
    console.log("Step 3: Generating audio with cloned voice...");
    
    const ttsResponse = await fetch("https://api.stepfun.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STEPFUN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "step-tts-mini",
        input: targetText,
        voice: voiceId,
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("TTS generation error:", ttsResponse.status, errorText);
      throw new Error(`Failed to generate audio: ${errorText}`);
    }

    console.log("Audio generated successfully with cloned voice");

    // Return the audio as binary
    const audioBuffer = await ttsResponse.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error in clone-voice function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
