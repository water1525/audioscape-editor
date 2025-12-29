import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, Upload, Mic, RefreshCw, Trash2, X, Loader2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";

// Sample texts for recording (~50 characters each, 10-30s reading time)
const sampleTexts = [
  "在这个快速发展的时代，科技改变了我们的生活方式，让我们能够更加便捷地与世界各地的人们进行交流和互动。",
  "春天的阳光温暖而明媚，万物复苏的季节里，花朵竞相绽放，鸟儿在枝头歌唱，一切都显得生机勃勃。",
  "人工智能技术正在深刻地改变着各行各业，从医疗诊断到自动驾驶，它的应用范围越来越广泛，影响着每个人的日常生活。",
  "夜晚的城市灯火辉煌，高楼大厦的窗户里透出温暖的光芒，街道上车水马龙，人们匆匆忙忙地赶往各自的目的地。",
  "音乐是一种无国界的语言，它能够跨越文化和地域的限制，触动每个人心中最柔软的部分，带来无尽的感动与共鸣。",
];

const emotionTags = ["高兴", "愤怒", "悲伤", "幽默", "困惑", "厌恶", "共情", "尴尬", "恐惧", "惊讶", "兴奋", "沮丧", "冷漠", "钦佩"];
const styleTags = [
  "严肃", "傲慢", "儿童", "单纯", "夸张", "少女", "御姐", "朗诵",
  "甜美", "空灵", "豪爽", "撒娇", "温暖", "害羞", "安慰", "权威",
  "闲聊", "电台", "深情", "温柔", "磁性", "中老年", "悄悄话",
  "气泡音", "讲故事", "绘声绘色", "节目主持", "新闻播报", "广告营销",
  "娱乐八卦", "吼叫", "小声", "大声", "低沉", "高亢"
];
const speedTags = ["快速", "慢速", "更快", "更慢"];

interface SentenceSegment {
  id: number;
  text: string;
  isEdited: boolean;
  versions: { url: string; tags: string[] }[];
  currentVersionIndex: number;
}

interface VoiceEditTabProps {
  onAudioGenerated?: (audioUrl: string, title: string) => void;
  onAudioDeleted?: () => void;
}

const VoiceEditTab = ({ onAudioGenerated, onAudioDeleted }: VoiceEditTabProps) => {
  // Upload/Record state
  const [audioSource, setAudioSource] = useState<"none" | "upload" | "record">("none");
  const [originalAudioBlob, setOriginalAudioBlob] = useState<Blob | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");
  
  // Recording state
  const [sampleText, setSampleText] = useState(sampleTexts[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(30);
  
  // Sentence segments state
  const [sentences, setSentences] = useState<SentenceSegment[]>([]);
  const [selectedSentenceId, setSelectedSentenceId] = useState<number | null>(null);
  const [editingSentenceId, setEditingSentenceId] = useState<number | null>(null);
  const [playingSentenceId, setPlayingSentenceId] = useState<number | null>(null);
  
  // Edit state
  const [showModal, setShowModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sentenceAudioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Split text into sentences
  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/[。！？，；]/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());
  };

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
    setSentences([]);
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
        
        // Split the sample text into sentences
        const sentenceTexts = splitIntoSentences(sampleText);
        const newSentences: SentenceSegment[] = sentenceTexts.map((text, index) => ({
          id: index,
          text,
          isEdited: false,
          versions: [],
          currentVersionIndex: -1,
        }));
        setSentences(newSentences);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(30);

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
    sentences.forEach(sentence => {
      sentence.versions.forEach(v => URL.revokeObjectURL(v.url));
    });
    setOriginalAudioBlob(null);
    setOriginalAudioUrl(null);
    setOriginalFileName("");
    setAudioSource("none");
    setSentences([]);
    setPlayingSentenceId(null);
    setSelectedSentenceId(null);
    onAudioDeleted?.();
  };

  // Open edit modal for a sentence
  const openEditModal = (sentenceId: number) => {
    setEditingSentenceId(sentenceId);
    setShowModal(true);
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Handle edit confirm for a sentence
  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      toast.error("请至少选择一个编辑参数");
      return;
    }
    
    if (editingSentenceId === null) return;
    
    const sentence = sentences.find(s => s.id === editingSentenceId);
    if (!sentence) return;
    
    setShowModal(false);
    setIsGenerating(true);
    const currentTags = [...selectedTags];
    setSelectedTags([]);
    
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
            text: sentence.text,
            voice: "tianmeinvsheng",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate edited audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      setSentences(prev => prev.map(s => {
        if (s.id === editingSentenceId) {
          const newVersions = [...s.versions, { url, tags: currentTags }];
          return {
            ...s,
            isEdited: true,
            versions: newVersions,
            currentVersionIndex: newVersions.length - 1,
          };
        }
        return s;
      }));
      
      onAudioGenerated?.(url, `句子${editingSentenceId + 1}_编辑版本`);
      toast.success(`句子编辑成功，已应用 ${currentTags.length} 个风格标签`);
    } catch (error) {
      console.error("Error generating edited audio:", error);
      toast.error("音频编辑失败，请重试");
    } finally {
      setIsGenerating(false);
      setEditingSentenceId(null);
    }
  };

  // Navigate sentence versions
  const navigateVersion = (sentenceId: number, direction: "prev" | "next") => {
    setSentences(prev => prev.map(s => {
      if (s.id === sentenceId && s.versions.length > 0) {
        let newIndex = s.currentVersionIndex;
        if (direction === "prev") {
          newIndex = Math.max(0, newIndex - 1);
        } else {
          newIndex = Math.min(s.versions.length - 1, newIndex + 1);
        }
        return { ...s, currentVersionIndex: newIndex };
      }
      return s;
    }));
  };

  // Play sentence audio
  const playSentenceAudio = (sentence: SentenceSegment) => {
    if (sentence.versions.length === 0 || sentence.currentVersionIndex < 0) return;
    
    const currentVersion = sentence.versions[sentence.currentVersionIndex];
    if (!currentVersion) return;
    
    if (sentenceAudioRef.current) {
      sentenceAudioRef.current.pause();
    }
    
    if (playingSentenceId === sentence.id) {
      setPlayingSentenceId(null);
      return;
    }
    
    const audio = new Audio(currentVersion.url);
    sentenceAudioRef.current = audio;
    
    audio.onplay = () => setPlayingSentenceId(sentence.id);
    audio.onended = () => setPlayingSentenceId(null);
    audio.onpause = () => setPlayingSentenceId(null);
    
    audio.play();
  };

  // Select sentence
  const handleSentenceClick = (sentence: SentenceSegment) => {
    setSelectedSentenceId(sentence.id);
    if (sentence.isEdited) {
      playSentenceAudio(sentence);
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
      sentences.forEach(sentence => {
        sentence.versions.forEach(v => URL.revokeObjectURL(v.url));
      });
    };
  }, []);

  // Generate waveform bars for visual effect
  const generateWaveformBars = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const height = 20 + Math.random() * 30;
      return (
        <div
          key={i}
          className="w-0.5 bg-current opacity-40 rounded-full"
          style={{ height: `${height}%` }}
        />
      );
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
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
            <div className="relative">
              <svg 
                width="80" 
                height="60" 
                viewBox="0 0 80 60" 
                fill="none"
                className="text-primary"
              >
                <path 
                  d="M5 30 L10 30 L15 20 L20 40 L25 15 L30 45 L35 10 L40 50 L45 5 L50 55 L55 20 L60 35 L65 25 L70 30 L75 30" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              <div className="absolute -top-2 -right-4">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="text-primary"
                >
                  <path 
                    d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="hsl(var(--primary) / 0.1)"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                请选择音频文件，可直接录制
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持mp3/wav格式，限制时长10-30S
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
            请在安静环境下朗读以下文本，需录制10-30秒语音
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
              disabled={countdown > 20}
              className="min-w-[120px]"
            >
              结束录制
            </Button>
            {countdown > 20 && (
              <p className="text-xs text-muted-foreground">录制至少10秒后可手动结束</p>
            )}
          </div>
        </div>
      )}

      {/* Recorded content with sentence timeline */}
      {originalAudioUrl && sentences.length > 0 && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">录制内容</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 gap-1"
              onClick={deleteAudio}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          </div>

          {/* Selected sentence detail panel */}
          {selectedSentenceId !== null && (
            <div className="bg-secondary/50 border border-border/50 rounded-lg p-4">
              {(() => {
                const sentence = sentences.find(s => s.id === selectedSentenceId);
                if (!sentence) return null;
                return (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground">句子 {sentence.id + 1}</span>
                          {sentence.isEdited && (
                            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                              已编辑
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {sentence.text}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(sentence.id)}
                        disabled={isGenerating && editingSentenceId === sentence.id}
                        className="gap-1 shrink-0"
                      >
                        {isGenerating && editingSentenceId === sentence.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            生成中
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3 w-3" />
                            编辑
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Version navigation */}
                    {sentence.isEdited && sentence.versions.length > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => navigateVersion(sentence.id, "prev")}
                          disabled={sentence.currentVersionIndex <= 0}
                          className="h-7 w-7"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                          版本 {sentence.currentVersionIndex + 1}/{sentence.versions.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => navigateVersion(sentence.id, "next")}
                          disabled={sentence.currentVersionIndex >= sentence.versions.length - 1}
                          className="h-7 w-7"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playSentenceAudio(sentence)}
                          className="h-7 gap-1 ml-2"
                        >
                          {playingSentenceId === sentence.id ? (
                            <>
                              <Pause className="h-3 w-3" />
                              暂停
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3" />
                              播放
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Horizontal sentence timeline */}
          <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
            <div 
              ref={timelineRef}
              className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              {sentences.map((sentence) => {
                const isSelected = selectedSentenceId === sentence.id;
                const isPlaying = playingSentenceId === sentence.id;
                
                return (
                  <div
                    key={sentence.id}
                    onClick={() => handleSentenceClick(sentence)}
                    className={`
                      relative flex-shrink-0 min-w-[120px] max-w-[200px] h-14 rounded-md cursor-pointer
                      transition-all duration-200 overflow-hidden group
                      ${isSelected || isPlaying
                        ? 'bg-primary/20 border-2 border-primary' 
                        : sentence.isEdited 
                          ? 'bg-primary/10 border border-primary/30 hover:border-primary/50'
                          : 'bg-secondary/50 border border-border/50 hover:border-border'
                      }
                    `}
                  >
                    {/* Waveform background */}
                    <div className={`absolute inset-0 flex items-center justify-center gap-0.5 px-2 ${
                      isSelected || isPlaying ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {generateWaveformBars(20)}
                    </div>
                    
                    {/* Text overlay */}
                    <div className="absolute inset-0 flex items-center px-2 bg-gradient-to-t from-background/80 via-background/40 to-transparent">
                      <p className={`text-xs line-clamp-2 leading-tight ${
                        isSelected || isPlaying ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        {sentence.text}
                      </p>
                    </div>
                    
                    {/* Edited badge */}
                    {sentence.isEdited && (
                      <div className="absolute top-1 right-1">
                        <span className="px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded">
                          已编辑
                        </span>
                      </div>
                    )}
                    
                    {/* Playing indicator */}
                    {isPlaying && (
                      <div className="absolute bottom-1 left-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-0.5 bg-primary rounded-full animate-pulse"
                              style={{
                                height: `${8 + i * 2}px`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Tip */}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              点击选中句子进行编辑，编辑后的句子可切换版本播放
            </p>
          </div>
        </div>
      )}

      {/* Upload mode - show simple player */}
      {originalAudioUrl && audioSource === "upload" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">上传的音频</h3>
          <div className="relative group bg-gradient-to-br from-secondary via-secondary/80 to-secondary rounded-xl p-4 border border-border/50">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 h-8">
                  {generateWaveformBars(15)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {originalFileName}
                  </p>
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
        </div>
      )}

      {/* Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-elevated animate-scale-in mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">参数设置</h3>
                <p className="text-sm text-muted-foreground">
                  编辑句子 {editingSentenceId !== null ? editingSentenceId + 1 : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => { setShowModal(false); setSelectedTags([]); setEditingSentenceId(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Show sentence text being edited */}
            {editingSentenceId !== null && (
              <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-foreground">
                  {sentences.find(s => s.id === editingSentenceId)?.text}
                </p>
              </div>
            )}

            {/* Tags Section */}
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">情绪</p>
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
                <p className="text-sm font-medium text-foreground mb-2">速度控制</p>
                <div className="flex flex-wrap gap-2">
                  {speedTags.map((tag, i) => (
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
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowModal(false); setSelectedTags([]); setEditingSentenceId(null); }}>
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default VoiceEditTab;
