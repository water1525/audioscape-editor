import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Pause, RefreshCw, Trash2, Sparkles, Save } from "lucide-react";
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
}

// Sample texts for recording (20-30 characters each)
const sampleTexts = [
  "阳光透过窗帘洒落在地板上，形成金色的光斑。",
  "科技的发展日新月异，正在改变我们的生活。",
  "中华文化源远流长，承载着深厚的历史底蕴。",
  "音乐是心灵的语言，能够触动每个人的内心。",
  "大自然用四季更迭，绘制出一幅壮丽的画卷。",
];

// AI generated target texts (20-30 characters each)
const aiTargetTexts = [
  "清晨的微风轻轻拂过脸颊，带来花朵的芬芳。",
  "城市的霓虹灯在夜幕中闪烁，如繁星点点。",
  "咖啡的香气弥漫在空气中，唤醒沉睡的灵魂。",
  "书页翻动的声音，是知识最美的旋律。",
  "雨滴敲打窗户的节奏，谱写一曲自然的乐章。",
  "孩子们的笑声回荡在公园里，充满纯真与快乐。",
  "夕阳将天空染成橘红色，美得令人心醉。",
  "春天的樱花如粉色的雪花，飘落在小径上。",
];

const VoiceCloneTab = ({ onAudioGenerated }: VoiceCloneTabProps) => {
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

      const { data, error } = await supabase.functions.invoke("clone-voice", {
        body: {
          audioBase64,
          sampleText, // The text that was spoken during recording
          targetText, // The text to generate with the cloned voice
        },
      });

      if (error) {
        throw new Error((error as any)?.message || "音色复刻失败");
      }

      const audioBlob = data instanceof Blob ? data : new Blob([data as any], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBlob);
      setClonedAudioUrl(url);
      toast.success("音色复刻成功！使用您的声音生成了音频");

      // Notify parent component to play in bottom bar
      onAudioGenerated?.(url, "复刻音频");
    } catch (error) {
      console.error("Voice cloning error:", error);
      toast.error(error instanceof Error ? error.message : "音色复刻失败，请重试");
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
      setVoiceNameError("音色名称至少需要1个字符");
      return;
    }
    
    if (trimmedName.length > 20) {
      setVoiceNameError("音色名称不能超过20个字符");
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
              {isPlayingRecorded && (
                <WaveformAnimation isPlaying={true} variant="small" barCount={4} />
              )}
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
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={generateAITargetText}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">AI</span>
              {aiTargetTexts.includes(targetText) && (
                <RefreshCw className="h-3 w-3 ml-0.5" />
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              {targetText.length}/1000字符
            </span>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">step 3 生成复刻音频</h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={openSaveDialog}>
              <Save className="h-4 w-4" />
              保存音色
            </Button>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground flex-1">
                音频已生成，请在底部播放器中播放
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAudioGenerated?.(clonedAudioUrl, "复刻音频")}
              >
                在播放器中打开
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
                placeholder="请输入音色名称（1-20个字符）"
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
                {voiceName.length}/20 字符
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
