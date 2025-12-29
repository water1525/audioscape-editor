import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Step TTS enforces a strict per-key concurrency limit (often 1).
// We serialize outbound calls per function instance to avoid 429s.
let stepApiQueue: Promise<unknown> = Promise.resolve();
const enqueueStepCall = <T>(task: () => Promise<T>) => {
  const run = stepApiQueue.then(task, task);
  stepApiQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "cixingnansheng" } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const STEPFUN_API_KEY = Deno.env.get("STEPFUN_API_KEY");
    if (!STEPFUN_API_KEY) {
      throw new Error("STEPFUN_API_KEY is not configured");
    }

    return await enqueueStepCall(async () => {
      console.log(
        "Calling Step TTS API with text:",
        text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        "voice:",
        voice
      );

      const maxAttempts = 3;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const requestBody = {
          model: "step-tts-mini",
          input: text,
          voice: voice,
          response_format: "mp3",
          speed: 1.0,
        };
        
        console.log("Request attempt", attempt + 1, "body:", JSON.stringify(requestBody));
        
        const response = await fetch("https://api.stepfun.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STEPFUN_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type") ?? "";
          const contentLength = response.headers.get("content-length");
          
          console.log(
            `Step TTS API response: status=${response.status}, content-type=${contentType}, content-length=${contentLength}`
          );

          // Always read as arrayBuffer first to avoid consuming the body twice
          const audioBuffer = await response.arrayBuffer();
          
          // Check if response is too small to be valid audio (likely an error)
          // A valid MP3 should be at least a few KB
          if (audioBuffer.byteLength < 100) {
            const decoder = new TextDecoder();
            const bodyText = decoder.decode(audioBuffer);
            console.error(
              `Step TTS API returned small/empty response (${audioBuffer.byteLength} bytes):`,
              bodyText
            );

            if (attempt < maxAttempts - 1) {
              await sleep(1000 * (attempt + 1));
              continue;
            }

            return new Response(
              JSON.stringify({
                error: `Step TTS API returned invalid response: ${bodyText || "(empty)"}`,
              }),
              {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          // Check if it's actually JSON (error response) by looking at first byte
          const firstByte = new Uint8Array(audioBuffer)[0];
          // JSON typically starts with { (123) or [ (91)
          if (firstByte === 123 || firstByte === 91) {
            const decoder = new TextDecoder();
            const bodyText = decoder.decode(audioBuffer);
            console.error("Step TTS API returned JSON with 200:", bodyText);

            if (attempt < maxAttempts - 1) {
              await sleep(1000 * (attempt + 1));
              continue;
            }

            return new Response(
              JSON.stringify({
                error: `Step TTS API error: ${bodyText}`,
              }),
              {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          console.log(
            "Step TTS API audio received successfully, bytes:",
            audioBuffer.byteLength
          );

          return new Response(audioBuffer, {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/octet-stream",
              "Content-Disposition": "inline; filename=\"audio.mp3\"",
            },
          });
        }

        const errorText = await response.text();
        console.error("Step TTS API error:", response.status, errorText);

        // If Step is rate-limiting due to concurrency, wait and retry.
        if (response.status === 429 && attempt < maxAttempts - 1) {
          const retryAfterHeader = response.headers.get("retry-after");
          const retryAfterMs = retryAfterHeader
            ? Math.max(0, Number(retryAfterHeader) * 1000)
            : 900 * (attempt + 1);

          await sleep(retryAfterMs);
          continue;
        }

        const upstreamStatus = response.status;

        // Avoid propagating non-2xx to the client for quota errors to prevent UI hard-fail.
        if (upstreamStatus === 402) {
          return new Response(
            JSON.stringify({
              error: "Step TTS quota exceeded. Please check your plan/billing.",
              upstream_status: upstreamStatus,
              upstream_error: errorText,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            error: `Step TTS API error: ${upstreamStatus} - ${errorText}`,
            upstream_status: upstreamStatus,
          }),
          {
            status: upstreamStatus,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Should be unreachable, but keeps TypeScript happy.
      return new Response(
        JSON.stringify({ error: "Step TTS API error: retry attempts exceeded" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
