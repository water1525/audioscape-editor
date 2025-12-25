import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Pause, RefreshCw, Trash2, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCustomVoices } from "@/hooks/useCustomVoices";

// Sample texts for recording (20-30 characters each)
const sampleTexts = [
  "阳光透过窗帘洒落在地板上，形成金色的光斑。",
  "科技的发展日新月异，正在改变我们的生活。",
  "中华文化源远流长，承载着深厚的历史底蕴。",
  "音乐是心灵的语言，能够触动每个人的内心。",
  "大自然用四季更迭，绘制出一幅壮丽的画卷。",
];

const VoiceCloneTab = () => {
  // Custom voices hook
  const { saveVoice } = useCustomVoices();

  // Step 1: Recording state
  const [sampleText, setSampleText] = useState(sampleTexts[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  
  // Step 2: Target text state
  const [targetText, setTargetText] = useState("");
  
  // Step 3: Clone state
  const [isCloning, setIsCloning] = useState(false);
  const [clonedAudioUrl, setClonedAudioUrl] = useState<string | null>(null);
  const [isPlayingCloned, setIsPlayingCloned] = useState(false);
  const [clonedDuration, setClonedDuration] = useState(0);
  const [clonedCurrentTime, setClonedCurrentTime] = useState(0);

  // Save voice dialog state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [voiceNameError, setVoiceNameError] = useState("");
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const clonedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random sample text
  const generateRandomText = () => {
    const currentIndex = sampleTexts.indexOf(sampleText);
    let newIndex = Math.floor(Math.random() * sampleTexts.length);
    while (newIndex === currentIndex && sampleTexts.length > 1) {
      newIndex = Math.floor(Math.random() * sampleTexts.length);
    }
    setSampleText(sampleTexts[newIndex]);
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(10);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      toast.success("开始录制，请朗读文本");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("无法访问麦克风，请检查权限设置");
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
      toast.success("录制完成");
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
    setIsPlayingRecorded(false);
    setClonedAudioUrl(null);
    setIsPlayingCloned(false);
    setClonedCurrentTime(0);
    setClonedDuration(0);
    clonedAudioRef.current = null;
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

  // Clone voice using Step TTS Mini
  const cloneVoice = async () => {
    if (!recordedAudio || !targetText.trim()) {
      toast.error("请先录制音频并输入目标文本");
      return;
    }

    setIsCloning(true);
    try {
      // Convert recorded audio blob to base64
      const arrayBuffer = await recordedAudio.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const audioBase64 = btoa(binary);

      // Call the clone-voice edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clone-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            audioBase64,
            sampleText, // The text that was spoken during recording
            targetText, // The text to generate with the cloned voice
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "音色复刻失败");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setClonedAudioUrl(url);
      toast.success("音色复刻成功！使用您的声音生成了音频");
    } catch (error) {
      console.error("Voice cloning error:", error);
      toast.error(error instanceof Error ? error.message : "音色复刻失败，请重试");
    } finally {
      setIsCloning(false);
    }
  };

  // Base64 to Blob helper
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Play/pause cloned audio
  const togglePlayCloned = () => {
    if (!clonedAudioUrl) return;

    if (!clonedAudioRef.current) {
      clonedAudioRef.current = new Audio(clonedAudioUrl);
      clonedAudioRef.current.onended = () => setIsPlayingCloned(false);
      clonedAudioRef.current.onloadedmetadata = () => {
        setClonedDuration(clonedAudioRef.current?.duration || 0);
      };
      clonedAudioRef.current.ontimeupdate = () => {
        setClonedCurrentTime(clonedAudioRef.current?.currentTime || 0);
      };
    }

    if (isPlayingCloned) {
      clonedAudioRef.current.pause();
      setIsPlayingCloned(false);
    } else {
      clonedAudioRef.current.play();
      setIsPlayingCloned(true);
    }
  };

  // Seek cloned audio
  const seekClonedAudio = (value: number[]) => {
    if (clonedAudioRef.current) {
      clonedAudioRef.current.currentTime = value[0];
      setClonedCurrentTime(value[0]);
    }
  };

  // Reset cloned audio
  const resetClonedAudio = () => {
    if (clonedAudioRef.current) {
      clonedAudioRef.current.currentTime = 0;
      setClonedCurrentTime(0);
    }
  };

  // Download cloned audio
  const downloadClonedAudio = () => {
    if (clonedAudioUrl) {
      const link = document.createElement("a");
      link.href = clonedAudioUrl;
      link.download = `cloned-voice-${Date.now()}.mp3`;
      link.click();
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    
    if (trimmedName.length < 5) {
      setVoiceNameError("音色名称至少需要5个字符");
      return;
    }
    
    if (trimmedName.length > 15) {
      setVoiceNameError("音色名称不能超过15个字符");
      return;
    }

    saveVoice(trimmedName);
    setIsSaveDialogOpen(false);
    setVoiceName("");
    toast.success(`音色"${trimmedName}"保存成功！`);
  };

  // Auto stop when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isRecording) {
      stopRecording();
    }
  }, [countdown, isRecording, stopRecording]);

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
        <h3 className="text-sm font-medium text-foreground">step 1 录制音频</h3>
        
        {!recordedAudioUrl ? (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <p className="text-sm text-muted-foreground text-center mb-4">
              请在安静环境下朗读以下文本，录制5-10秒语音
            </p>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-base text-foreground text-center leading-relaxed max-w-lg">
                {sampleText}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={generateRandomText}
                disabled={isRecording}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {isRecording ? (
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-bold text-primary">{countdown}S</div>
                <Button
                  variant="outline"
                  onClick={stopRecording}
                  disabled={countdown > 5}
                  className="min-w-[120px]"
                >
                  结束录制
                </Button>
                {countdown > 5 && (
                  <p className="text-xs text-muted-foreground">录制至少5秒后可手动结束</p>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={startRecording} className="min-w-[120px]">
                  开始录制
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-primary/10"
                onClick={togglePlayRecorded}
              >
                {isPlayingRecorded ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {Date.now()}.wav
                </p>
                <p className="text-xs text-muted-foreground">00:10</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={deleteRecordedAudio}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Target Text */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">step 2 输入目标音频文本</h3>
        <div className="relative">
          <Textarea
            placeholder="点此输入想要生成的音频文本"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value.slice(0, 1000))}
            className="min-h-[120px] resize-none pr-16"
          />
          <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">
            {targetText.length}/1000字符
          </span>
        </div>
      </div>

      {/* Clone Button */}
      {recordedAudioUrl && targetText.trim() && (
        <div className="flex justify-center">
          <Button
            onClick={cloneVoice}
            disabled={isCloning}
            className="min-w-[120px]"
          >
            {isCloning ? "复刻中..." : "复刻音色"}
          </Button>
        </div>
      )}

      {/* Step 3: Cloned Audio Player */}
      {clonedAudioUrl && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">step 3 生成复刻音频</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-primary/10"
              onClick={togglePlayCloned}
            >
              {isPlayingCloned ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <div className="flex-1 space-y-2">
              <Slider
                value={[clonedCurrentTime]}
                max={clonedDuration || 100}
                step={0.1}
                onValueChange={seekClonedAudio}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(clonedCurrentTime)}</span>
                <span>{formatTime(clonedDuration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={resetClonedAudio}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={downloadClonedAudio}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" className="min-w-[100px]" onClick={openSaveDialog}>
              保存音色
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* Save Voice Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>保存音色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                音色名称
              </label>
              <Input
                placeholder="请输入音色名称（5-15个字符）"
                value={voiceName}
                onChange={(e) => {
                  setVoiceName(e.target.value);
                  setVoiceNameError("");
                }}
                maxLength={15}
              />
              {voiceNameError && (
                <p className="text-sm text-destructive">{voiceNameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {voiceName.length}/15 字符
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveVoice}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceCloneTab;
