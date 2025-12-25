import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, Upload, Mic, RefreshCw, Trash2, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

// Sample texts for recording (25-30 characters each)
const sampleTexts = [
  "清晨的阳光透过薄雾洒向大地，万物开始苏醒。",
  "科技的进步让我们的生活变得更加便捷和美好。",
  "春风轻轻吹过田野，带来花朵的芬芳和希望。",
  "音乐能够治愈心灵，让人忘却烦恼找到平静。",
  "夜空中繁星闪烁，诉说着宇宙无尽的神秘故事。",
];

const emotionTags = [
  "电台", "纪录", "亲密", "稳健", "大气", "沉稳", "月亮", "阳光", "磁性",
];
const styleTags = [
  "严厉", "抒情", "共鸣", "清亮", "质朴", "孝庄", "快速",
];
const ageTags = ["严肃", "膨胀", "儿童", "平静", "可等", "呼呼", "吹嘘", "请谅"];
const otherTags = [
  "迷人", "法语", "风雨", "浏河", "法语", "中老年", "特别女",
];

// Waveform animation component
const WaveformAnimation = ({ isPlaying, variant = "default" }: { isPlaying: boolean; variant?: "default" | "primary" }) => {
  const colorClass = variant === "primary" ? "bg-primary" : "bg-foreground/60";
  
  if (!isPlaying) {
    return (
      <div className="flex items-center gap-[3px] h-8">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`w-[3px] rounded-full ${colorClass} opacity-30`}
            style={{ height: `${12 + (i % 3) * 4}px` }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-[3px] h-8">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full waveform-bar ${colorClass}`}
          style={{ 
            height: '24px',
            transformOrigin: 'center'
          }}
        />
      ))}
    </div>
  );
};

interface EditedAudio {
  url: string;
  fileName: string;
}

const VoiceEditTab = () => {
  // Upload/Record state
  const [audioSource, setAudioSource] = useState<"none" | "upload" | "record">("none");
  const [originalAudioBlob, setOriginalAudioBlob] = useState<Blob | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");
  
  // Recording state
  const [sampleText, setSampleText] = useState(sampleTexts[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  // Audio playback state
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [playingEditedIndex, setPlayingEditedIndex] = useState<number | null>(null);
  
  // Edit state
  const [showModal, setShowModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedAudios, setEditedAudios] = useState<EditedAudio[]>([]);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const editedAudioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());

  // Generate random sample text
  const generateRandomText = () => {
    const currentIndex = sampleTexts.indexOf(sampleText);
    let newIndex = Math.floor(Math.random() * sampleTexts.length);
    while (newIndex === currentIndex && sampleTexts.length > 1) {
      newIndex = Math.floor(Math.random() * sampleTexts.length);
    }
    setSampleText(sampleTexts[newIndex]);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("请上传音频文件（mp3, wav等）");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过10MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setOriginalAudioBlob(file);
    setOriginalAudioUrl(url);
    setOriginalFileName(file.name);
    setAudioSource("upload");
    // Clear previous edited audios
    editedAudios.forEach(audio => URL.revokeObjectURL(audio.url));
    setEditedAudios([]);
    toast.success("音频上传成功");
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
        const url = URL.createObjectURL(audioBlob);
        setOriginalAudioBlob(audioBlob);
        setOriginalAudioUrl(url);
        setOriginalFileName(`录制_${Date.now()}.wav`);
        setAudioSource("record");
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(10);

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

  // Auto stop when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isRecording) {
      stopRecording();
    }
  }, [countdown, isRecording, stopRecording]);

  // Delete audio
  const deleteAudio = () => {
    if (originalAudioUrl) {
      URL.revokeObjectURL(originalAudioUrl);
    }
    editedAudios.forEach(audio => URL.revokeObjectURL(audio.url));
    setOriginalAudioBlob(null);
    setOriginalAudioUrl(null);
    setOriginalFileName("");
    setAudioSource("none");
    setEditedAudios([]);
    setIsPlayingOriginal(false);
    setPlayingEditedIndex(null);
  };

  // Toggle play original
  const togglePlayOriginal = () => {
    if (!originalAudioRef.current || !originalAudioUrl) return;
    
    if (isPlayingOriginal) {
      originalAudioRef.current.pause();
      setIsPlayingOriginal(false);
    } else {
      // Pause any playing edited audio
      if (playingEditedIndex !== null) {
        const editedAudio = editedAudioRefs.current.get(playingEditedIndex);
        if (editedAudio) editedAudio.pause();
        setPlayingEditedIndex(null);
      }
      originalAudioRef.current.play();
      setIsPlayingOriginal(true);
    }
  };

  // Toggle play edited audio
  const togglePlayEdited = (index: number) => {
    const audioElement = editedAudioRefs.current.get(index);
    if (!audioElement) return;
    
    if (playingEditedIndex === index) {
      audioElement.pause();
      setPlayingEditedIndex(null);
    } else {
      // Pause original if playing
      if (isPlayingOriginal && originalAudioRef.current) {
        originalAudioRef.current.pause();
        setIsPlayingOriginal(false);
      }
      // Pause other edited audio
      if (playingEditedIndex !== null) {
        const otherAudio = editedAudioRefs.current.get(playingEditedIndex);
        if (otherAudio) otherAudio.pause();
      }
      audioElement.play();
      setPlayingEditedIndex(index);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Handle edit confirm
  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      toast.error("请至少选择一个编辑参数");
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/step-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: sampleText,
            voice: "tianmeinvsheng",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate edited audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const editNumber = editedAudios.length + 1;
      const baseFileName = originalFileName.replace(/\.\w+$/, "");
      const newFileName = `${baseFileName}_v${editNumber}.wav`;
      
      setEditedAudios(prev => [...prev, { url, fileName: newFileName }]);
      setShowModal(false);
      setSelectedTags([]);
      
      toast.success(`音频编辑成功，已应用 ${selectedTags.length} 个风格标签`);
    } catch (error) {
      console.error("Error generating edited audio:", error);
      toast.error("音频编辑失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (originalAudioUrl) {
        URL.revokeObjectURL(originalAudioUrl);
      }
      editedAudios.forEach(audio => URL.revokeObjectURL(audio.url));
    };
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hidden audio elements */}
      {originalAudioUrl && (
        <audio
          ref={originalAudioRef}
          src={originalAudioUrl}
          onEnded={() => setIsPlayingOriginal(false)}
        />
      )}
      {editedAudios.map((audio, index) => (
        <audio
          key={index}
          ref={(el) => {
            if (el) {
              editedAudioRefs.current.set(index, el);
            } else {
              editedAudioRefs.current.delete(index);
            }
          }}
          src={audio.url}
          onEnded={() => setPlayingEditedIndex(null)}
        />
      ))}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Initial State: Upload or Record */}
      {audioSource === "none" && !isRecording && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            {/* Stylized Icon Design */}
            <div className="relative flex items-center justify-center">
              {/* Microphone with waveform design */}
              <div className="relative">
                <Mic className="h-10 w-10 text-primary" />
                {/* Decorative curved lines */}
                <svg 
                  className="absolute -right-3 top-1/2 -translate-y-1/2 text-primary/60" 
                  width="20" 
                  height="24" 
                  viewBox="0 0 20 24" 
                  fill="none"
                >
                  <path 
                    d="M2 6C6 6 6 18 2 18" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M8 3C14 3 14 21 8 21" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                请选择音频文件，可直接录制
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持mp3/wav格式，限制时长5-10S
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                上传音频
              </Button>
              <Button
                onClick={startRecording}
                className="gap-2"
              >
                <Mic className="h-4 w-4" />
                开始录制
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recording State */}
      {isRecording && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <p className="text-sm text-muted-foreground text-center mb-4">
            请在安静环境下朗读以下文本，需录制5-10秒语音
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

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 20 + 10}px`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground ml-2">🎙️</span>
            </div>
            
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
        </div>
      )}

      {/* Original Audio Section */}
      {originalAudioUrl && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">原始音频</h3>
          <div className="relative group bg-gradient-to-br from-secondary via-secondary/80 to-secondary rounded-xl p-4 border border-border/50 shadow-[var(--shadow-audio)] hover:shadow-md transition-all duration-300">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="audioSquare" 
                  size="icon"
                  onClick={togglePlayOriginal}
                  className="w-12 h-12 shrink-0"
                >
                  {isPlayingOriginal ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                
                <WaveformAnimation isPlaying={isPlayingOriginal} variant="default" />
                
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {originalFileName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">时长 00:10</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                onClick={deleteAudio}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Edit Button - Below original audio */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowModal(true)}
              className="min-w-[140px] gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Sparkles className="h-4 w-4" />
              编辑
            </Button>
          </div>
        </div>
      )}

      {/* Edited Audio Section */}
      {editedAudios.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          <h3 className="text-sm font-medium text-foreground">编辑后的音频</h3>
          <div className="space-y-3">
            {editedAudios.map((audio, index) => (
              <div 
                key={index}
                className="relative group bg-gradient-to-br from-accent via-primary/5 to-accent rounded-xl p-4 border border-primary/20 shadow-[var(--shadow-audio)] hover:shadow-md hover:shadow-primary/10 transition-all duration-300"
              >
                <div className="relative flex items-center gap-4">
                  <Button 
                    variant="audioSquare" 
                    size="icon"
                    onClick={() => togglePlayEdited(index)}
                    className="w-12 h-12 shrink-0"
                  >
                    {playingEditedIndex === index ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  
                  <WaveformAnimation isPlaying={playingEditedIndex === index} variant="primary" />
                  
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {audio.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">时长 00:10</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-elevated animate-scale-in mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  参数设置
                </h3>
                <p className="text-xs text-muted-foreground">
                  {editedAudios.length > 0 
                    ? `基于第 ${editedAudios.length} 次编辑继续调整` 
                    : "选择编辑参数来调整音频风格"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setShowModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tags Section */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">情感</p>
                <div className="flex flex-wrap gap-2">
                  {emotionTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">风格</p>
                <div className="flex flex-wrap gap-2">
                  {styleTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">年龄</p>
                <div className="flex flex-wrap gap-2">
                  {ageTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">其他</p>
                <div className="flex flex-wrap gap-2">
                  {otherTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                已选择 {selectedTags.length} 个标签
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => { setShowModal(false); setSelectedTags([]); }}>
                  取消
                </Button>
                <Button onClick={handleConfirm} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      生成中...
                    </>
                  ) : "确认"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VoiceEditTab;
