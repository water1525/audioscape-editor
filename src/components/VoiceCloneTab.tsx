import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Pause, RefreshCw, Sparkles, Save } from "lucide-react";
import { MicrophoneIcon } from "@/components/ui/TabIcons";
import DeleteIcon from "@/components/ui/DeleteIcon";
import { toast } from "sonner";
import WaveformAnimation from "@/components/ui/WaveformAnimation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCustomVoices } from "@/hooks/useCustomVoices";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCloneTabProps {
  onAudioGenerated?: (audioUrl: string, title: string) => void;
  onSaveVoiceReady?: (openSaveDialog: () => void) => void;
  onAudioDeleted?: () => void;
}

// Sample texts for recording (20-30 characters each)
const sampleTexts = [
  "阳光透过窗帘洒落，在地板上投下金色的光斑。",
  "科技日新月异，改变着我们生活的方方面面。",
  "音乐是一种跨越国界的语言，能够触动每个人的心灵。",
  "大自然用四季的变换描绘出最美的画卷。",
  "清晨的微风轻抚脸颊，带来阵阵花香。",
];

// AI generated target texts (20-30 characters each)
const aiTargetTexts = [
  "晨露在花瓣上闪烁，迎接崭新的一天。",
  "城市的灯火在夜空中闪烁，如繁星点点。",
  "咖啡的香气弥漫在空气中，唤醒沉睡的灵魂。",
  "翻书的声音是知识最美的旋律。",
  "雨滴敲打着窗户，奏响大自然的交响乐。",
  "孩子们的笑声在公园里回荡，纯真而快乐。",
  "夕阳将天空染成橙红色，美得令人窒息。",
  "春日的樱花如粉色的雪，飘落在蜿蜒的小路上。",
];

const VoiceCloneTab = ({ onAudioGenerated, onSaveVoiceReady, onAudioDeleted }: VoiceCloneTabProps) => {
  // Custom voices hook
  const { saveVoice } = useCustomVoices();

  // Step 1: Recording state
  const [sampleText, setSampleText] = useState(sampleTexts[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioName, setRecordedAudioName] = useState<string>("");
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  
  // Step 2: Target text state
  const [targetText, setTargetText] = useState("");
  
  // Step 3: Clone state
  const [isCloning, setIsCloning] = useState(false);
  const [clonedAudioUrl, setClonedAudioUrl] = useState<string | null>(null);

  // Save voice dialog state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [voiceNameError, setVoiceNameError] = useState("");
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random sample text
  const generateRandomText = () => {
    const currentIndex = sampleTexts.indexOf(sampleText);
    let newIndex = Math.floor(Math.random() * sampleTexts.length);
    while (newIndex === currentIndex && sampleTexts.length > 1) {
      newIndex = Math.floor(Math.random() * sampleTexts.length);
    }
    setSampleText(sampleTexts[newIndex]);
  };

  // Generate AI target text
  const generateAITargetText = () => {
    const currentIndex = aiTargetTexts.indexOf(targetText);
    let newIndex = Math.floor(Math.random() * aiTargetTexts.length);
    while (newIndex === currentIndex && aiTargetTexts.length > 1) {
      newIndex = Math.floor(Math.random() * aiTargetTexts.length);
    }
    setTargetText(aiTargetTexts[newIndex]);
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported MIME types - prefer webm/opus as it's widely supported
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose default
          }
        }
      }
      
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the actual MIME type from MediaRecorder
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        // Use appropriate extension based on MIME type
        const ext = actualMimeType.includes('webm') ? 'webm' : actualMimeType.includes('ogg') ? 'ogg' : 'wav';
        setRecordedAudioName(`${Date.now()}.${ext}`);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(10);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      toast.success("Recording started. Please read the text.");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Cannot access microphone. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      toast.success("Recording completed");
    }
  }, [isRecording]);

  // Delete recorded audio
  const deleteRecordedAudio = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    if (clonedAudioUrl) {
      URL.revokeObjectURL(clonedAudioUrl);
    }
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setRecordedAudioName("");
    setIsPlayingRecorded(false);
    setClonedAudioUrl(null);
    // Notify parent to hide the player bar
    onAudioDeleted?.();
  };

  // Play/pause recorded audio
  const togglePlayRecorded = () => {
    if (!recordedAudioUrl) return;

    if (!recordedAudioRef.current) {
      recordedAudioRef.current = new Audio(recordedAudioUrl);
      recordedAudioRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      recordedAudioRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      recordedAudioRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  // Convert recorded audio to WAV (mono, 16kHz) for Step API compatibility
  const convertToWav = async (
    audioBlob: Blob,
  ): Promise<{ wav: Blob; durationSec: number; rms: number }> => {
    const TARGET_SAMPLE_RATE = 16000;
    const MIN_SEC = 5;
    const MAX_SEC = 10;

    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decode to PCM
    const decodeCtx = new AudioContext();
    let decoded: AudioBuffer;
    try {
      // Some browsers require a copy of the buffer
      decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    } finally {
      // Best-effort close
      decodeCtx.close().catch(() => {});
    }

    // Downmix to mono
    const mono = new Float32Array(decoded.length);
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      const chData = decoded.getChannelData(ch);
      for (let i = 0; i < chData.length; i++) {
        mono[i] += chData[i] / decoded.numberOfChannels;
      }
    }

    // Resample to 16kHz (Step API is most reliable at this rate)
    const durationSec = decoded.length / decoded.sampleRate;
    const targetLength = Math.max(1, Math.ceil(durationSec * TARGET_SAMPLE_RATE));

    const offline = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE);
    const monoBuffer = offline.createBuffer(1, mono.length, decoded.sampleRate);
    monoBuffer.getChannelData(0).set(mono);

    const source = offline.createBufferSource();
    source.buffer = monoBuffer;
    source.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();

    // Enforce duration constraints (Step API requires 5-10 seconds)
    const minSamples = MIN_SEC * TARGET_SAMPLE_RATE;
    const maxSamples = MAX_SEC * TARGET_SAMPLE_RATE;
    if (rendered.length < minSamples) {
      throw new Error("录音时长不足 5 秒，请重新录制并完整朗读");
    }

    const finalSamples = rendered.getChannelData(0).slice(0, Math.min(rendered.length, maxSamples));

    // Simple silence check
    let sumSq = 0;
    for (let i = 0; i < finalSamples.length; i++) sumSq += finalSamples[i] * finalSamples[i];
    const rms = Math.sqrt(sumSq / finalSamples.length);
    if (rms < 0.008) {
      throw new Error("录音声音过小/过安静，请靠近麦克风并提高音量后重试");
    }

    // Encode WAV (PCM 16-bit LE)
    const dataBytes = finalSamples.length * 2;
    const buffer = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // PCM header size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, TARGET_SAMPLE_RATE, true);
    view.setUint32(28, TARGET_SAMPLE_RATE * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, "data");
    view.setUint32(40, dataBytes, true);

    let offset = 44;
    for (let i = 0; i < finalSamples.length; i++) {
      const s = Math.max(-1, Math.min(1, finalSamples[i]));
      const int16 = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
      view.setInt16(offset, int16, true);
      offset += 2;
    }

    return {
      wav: new Blob([buffer], { type: "audio/wav" }),
      durationSec: finalSamples.length / TARGET_SAMPLE_RATE,
      rms,
    };
  };

  // Clone voice using Step TTS Mini
  const cloneVoice = async () => {
    if (!recordedAudio || !targetText.trim()) {
      toast.error("请先录音并填写要生成的文本");
      return;
    }

    setIsCloning(true);
    try {
      toast.info("正在处理录音格式...");
      const { wav, durationSec } = await convertToWav(recordedAudio);

      // Convert WAV blob to base64
      const uint8 = new Uint8Array(await wav.arrayBuffer());
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
      }
      const audioBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("clone-voice", {
        body: {
          audioBase64,
          sampleText, // user-read text
          targetText, // text to synthesize with cloned voice
          mimeType: "audio/wav",
          meta: { durationSec },
        },
      });

      if (error) {
        const status = (error as any)?.context?.status ?? (error as any)?.status;
        const msg = (error as any)?.message || "Voice cloning failed";
        throw new Error(status ? `克隆请求失败（${status}）：${msg}` : `克隆请求失败：${msg}`);
      }

      // Some backends return { error } with HTTP 200
      if (data && typeof data === "object" && "error" in (data as any)) {
        throw new Error(String((data as any).error || "Voice cloning failed"));
      }

      // Legacy backend: { audioBase64, format }
      if (data && typeof data === "object" && "audioBase64" in (data as any)) {
        const audioBlob = base64ToBlob(String((data as any).audioBase64), "audio/mpeg");
        const url = URL.createObjectURL(audioBlob);
        setClonedAudioUrl(url);
        toast.success("克隆成功，已生成试听音频");
        onAudioGenerated?.(url, "Cloned Audio");
        return;
      }

      // New backend: returns MP3 bytes
      if (data instanceof Blob) {
        if (data.size === 0) throw new Error("生成音频为空，请稍后重试");
        const url = URL.createObjectURL(data);
        setClonedAudioUrl(url);
        toast.success("克隆成功，已生成试听音频");
        onAudioGenerated?.(url, "Cloned Audio");
        return;
      }

      if (data instanceof ArrayBuffer) {
        const audioBlob = new Blob([data], { type: "audio/mpeg" });
        if (audioBlob.size === 0) throw new Error("生成音频为空，请稍后重试");
        const url = URL.createObjectURL(audioBlob);
        setClonedAudioUrl(url);
        toast.success("克隆成功，已生成试听音频");
        onAudioGenerated?.(url, "Cloned Audio");
        return;
      }

      if (data instanceof Uint8Array) {
        const audioBlob = new Blob([data as unknown as BlobPart], { type: "audio/mpeg" });
        if (audioBlob.size === 0) throw new Error("生成音频为空，请稍后重试");
        const url = URL.createObjectURL(audioBlob);
        setClonedAudioUrl(url);
        toast.success("克隆成功，已生成试听音频");
        onAudioGenerated?.(url, "Cloned Audio");
        return;
      }

      throw new Error("返回数据格式异常，请稍后重试");
    } catch (error) {
      console.error("Voice cloning error:", error);
      toast.error(error instanceof Error ? error.message : "Voice cloning failed. Please try again.");
    } finally {
      setIsCloning(false);
    }
  };

  // Base64 to Blob helper (kept for potential future use)
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Open save dialog
  const openSaveDialog = () => {
    setVoiceName("");
    setVoiceNameError("");
    setIsSaveDialogOpen(true);
  };

  // Validate and save voice
  const handleSaveVoice = () => {
    const trimmedName = voiceName.trim();
    
    if (trimmedName.length < 1) {
      setVoiceNameError("Voice name must be at least 1 character");
      return;
    }
    
    if (trimmedName.length > 20) {
      setVoiceNameError("Voice name cannot exceed 20 characters");
      return;
    }

    saveVoice(trimmedName);
    setIsSaveDialogOpen(false);
    setVoiceName("");
    toast.success(`Voice "${trimmedName}" saved successfully!`);
  };

  // Auto stop when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isRecording) {
      stopRecording();
    }
  }, [countdown, isRecording, stopRecording]);

  // Expose openSaveDialog to parent when cloned audio is ready
  useEffect(() => {
    if (clonedAudioUrl && onSaveVoiceReady) {
      onSaveVoiceReady(openSaveDialog);
    }
  }, [clonedAudioUrl, onSaveVoiceReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (clonedAudioUrl) {
        URL.revokeObjectURL(clonedAudioUrl);
      }
    };
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Step 1: Record Audio */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Step 1: Record Audio</h3>
        
        {!recordedAudioUrl ? (
          <div className="bg-[#F5F8FB] border border-border rounded-[3px] p-6">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Please read the following text in a quiet environment, recording 5-10 seconds
            </p>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-base text-foreground text-center leading-relaxed max-w-lg">
                {sampleText}
              </p>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 bg-white hover:bg-[#CCCCCC] border-border"
                onClick={generateRandomText}
                disabled={isRecording}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {isRecording ? (
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-bold text-[hsl(221,100%,43%)]">{countdown}S</div>
                <Button
                  onClick={stopRecording}
                  disabled={countdown > 5}
                  className="min-w-[120px] bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,30%)] text-white font-semibold"
                >
                  Stop Recording
                </Button>
                {countdown > 5 && (
                  <p className="text-xs text-muted-foreground">Can stop manually after 5 seconds</p>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={startRecording} className="min-w-[180px] bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,30%)] text-white font-semibold">
                  <MicrophoneIcon className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[3px] p-4">
            <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayRecorded}
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-colors hover:bg-primary/20 text-primary"
                >
                  {isPlayingRecorded ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              {isPlayingRecorded && (
                <WaveformAnimation isPlaying={true} variant="small" barCount={4} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {recordedAudioName}
                </p>
                <p className="text-xs text-muted-foreground">00:10</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={deleteRecordedAudio}
              >
                <DeleteIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Target Text */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Step 2: Enter Target Text</h3>
        <div className="relative">
          <Textarea
            placeholder="Enter the text you want to generate audio for"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value.slice(0, 1000))}
            className="min-h-[120px] resize-none pr-16"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {targetText.length}/1000 chars
            </span>
            <button
              onClick={generateAITargetText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,30%)] text-white text-xs font-semibold rounded-[3px] transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI</span>
              {aiTargetTexts.includes(targetText) && (
                <RefreshCw className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clone Button */}
      {recordedAudioUrl && targetText.trim() && (
        isCloning ? (
          <div className="w-full h-10 bg-[hsl(221,100%,43%)] rounded-[3px] overflow-hidden">
            <div className="h-full bg-[hsl(221,100%,30%)] animate-pulse" style={{ width: '100%' }} />
          </div>
        ) : (
          <Button
            onClick={cloneVoice}
            className="w-full bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,30%)] text-white font-semibold"
          >
            Clone Voice
          </Button>
        )
      )}


      {/* Save Voice Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Voice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Voice Name
              </label>
              <Input
                placeholder="Enter voice name (1-20 characters)"
                value={voiceName}
                onChange={(e) => {
                  setVoiceName(e.target.value);
                  setVoiceNameError("");
                }}
                maxLength={20}
              />
              {voiceNameError && (
                <p className="text-sm text-destructive">{voiceNameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {voiceName.length}/20 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} className="font-semibold">
              Cancel
            </Button>
            <Button onClick={handleSaveVoice} className="bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,30%)] text-white font-semibold">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceCloneTab;
