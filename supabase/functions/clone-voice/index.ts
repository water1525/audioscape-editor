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
    const { audioBase64, sampleText, targetText, mimeType } = await req.json();

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
    console.log("Audio MIME type:", mimeType || "not specified");

    // Step 1: Upload the audio file
    console.log("Step 1: Uploading audio file...");
    
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    
    // StepFun API only supports: mp3, wav, m4a, ogg (not webm!)
    // Since browser MediaRecorder typically outputs webm, we need to use a supported format
    // We'll upload as WAV which is most universally supported
    const audioMimeType = mimeType || "audio/webm";
    console.log("Original MIME type:", audioMimeType);
    
    // For webm audio, we need to convert or use a workaround
    // StepFun supports: mp3, wav, m4a, ogg
    // We'll try uploading with .ogg extension as it's closest to webm/opus
    let fileExt = "wav";
    let uploadMimeType = "audio/wav";
    
    if (audioMimeType.includes("ogg")) {
      fileExt = "ogg";
      uploadMimeType = "audio/ogg";
    } else if (audioMimeType.includes("mp4") || audioMimeType.includes("m4a")) {
      fileExt = "m4a";
      uploadMimeType = "audio/mp4";
    } else if (audioMimeType.includes("wav")) {
      fileExt = "wav";
      uploadMimeType = "audio/wav";
    } else if (audioMimeType.includes("mpeg") || audioMimeType.includes("mp3")) {
      fileExt = "mp3";
      uploadMimeType = "audio/mpeg";
    } else if (audioMimeType.includes("webm") || audioMimeType.includes("opus")) {
      // WebM/Opus is not supported by StepFun, but ogg container with opus codec might work
      // Try ogg as it's the closest supported format
      fileExt = "ogg";
      uploadMimeType = "audio/ogg";
    }
    
    console.log("Using file extension:", fileExt, "upload MIME type:", uploadMimeType);
    
    // Create form data for file upload
    const formData = new FormData();
    const audioBlob = new Blob([binaryData], { type: uploadMimeType });
    formData.append("file", audioBlob, `recording.${fileExt}`);
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
          ...(sampleText ? { text: sampleText } : {}),
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

    // Return the audio as base64 JSON (more reliable for web clients)
    const audioBuffer = await ttsResponse.arrayBuffer();
    const uint8 = new Uint8Array(audioBuffer);

    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
    }

    const audioBase64Out = btoa(binary);

    return new Response(JSON.stringify({ audioBase64: audioBase64Out, format: "mp3" }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
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
