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
        text.substring(0, 50) + "..."
      );

      const maxAttempts = 5;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
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

        if (response.ok) {
          const contentType = response.headers.get("content-type") ?? "";

          // Some upstream failures can still return 200 with a JSON body.
          if (contentType.includes("application/json")) {
            const maybeError = await response.text();
            console.error("Step TTS API returned JSON with 200:", maybeError);

            if (attempt < maxAttempts - 1) {
              await sleep(700 * (attempt + 1));
              continue;
            }

            return new Response(
              JSON.stringify({
                error: `Step TTS API returned JSON with 200: ${maybeError}`,
              }),
              {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          // Return the audio as binary
          const audioBuffer = await response.arrayBuffer();
          console.log(
            "Step TTS API response received successfully",
            "content-length:",
            response.headers.get("content-length"),
            "bytes:",
            audioBuffer.byteLength
          );

          // Occasionally the upstream returns 200 with an empty body.
          // Treat as transient and retry.
          if (audioBuffer.byteLength === 0) {
            console.error("Step TTS API returned empty audio with 200");

            if (attempt < maxAttempts - 1) {
              await sleep(700 * (attempt + 1));
              continue;
            }

            return new Response(
              JSON.stringify({ error: "Step TTS API returned empty audio" }),
              {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          return new Response(audioBuffer, {
            headers: {
              ...corsHeaders,
              // functions-js treats octet-stream as binary and returns Blob on the client
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
