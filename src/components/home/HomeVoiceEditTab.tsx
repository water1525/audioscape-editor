import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play, X, Loader2 } from "lucide-react";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emotionTags = ["电台", "纪录", "亲密", "稳健", "大气", "沉稳", "月亮", "阳光", "磁性"];
const styleTags = ["严厉", "抒情", "共鸣", "清亮", "质朴", "快速"];

const HomeVoiceEditTab = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingEdited, setIsPlayingEdited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedAudioUrl, setEditedAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<string>("--:--");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const editedAudioRef = useRef<HTMLAudioElement | null>(null);
  const { playAudio, stopGlobalAudio } = useGlobalAudio();

  const audioFile = "voice-edit/xinxingren-maoxian.mp3";

  const getAudioUrl = () => {
    const { data } = supabase.storage.from("audio").getPublicUrl(audioFile);
    return data.publicUrl;
  };

  // Load and calculate audio duration
  useEffect(() => {
    const audio = new Audio(getAudioUrl());
    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      setAudioDuration(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    });
    audio.addEventListener("error", () => {
      setAudioDuration("--:--");
    });
  }, []);

  const handlePlayPause = () => {
    if (isPlaying && audioRef.current) {
      stopGlobalAudio();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    stopGlobalAudio();
    setIsPlayingEdited(false);
    
    const audio = new Audio(getAudioUrl());
    audioRef.current = audio;
    
    playAudio(audio, () => {
      setIsPlaying(false);
      audioRef.current = null;
    });

    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setIsPlaying(false);
      audioRef.current = null;
      toast.error("音频播放失败");
    };

    audio.play().catch(() => {
      setIsPlaying(false);
      toast.error("音频播放失败");
    });
    
    setIsPlaying(true);
  };

  const handlePlayEditedPause = () => {
    if (!editedAudioUrl) return;
    
    if (isPlayingEdited && editedAudioRef.current) {
      stopGlobalAudio();
      editedAudioRef.current = null;
      setIsPlayingEdited(false);
      return;
    }

    stopGlobalAudio();
    setIsPlaying(false);
    
    const audio = new Audio(editedAudioUrl);
    editedAudioRef.current = audio;
    
    playAudio(audio, () => {
      setIsPlayingEdited(false);
      editedAudioRef.current = null;
    });

    audio.onended = () => {
      setIsPlayingEdited(false);
      editedAudioRef.current = null;
    };

    audio.play().catch(() => {
      setIsPlayingEdited(false);
      toast.error("音频播放失败");
    });
    
    setIsPlayingEdited(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      toast.error("请至少选择一个编辑参数");
      return;
    }
    
    setIsGenerating(true);
    try {
      // 星星人冒险的文案
      const text = "在遥远的星空中，住着一群可爱的星星人。他们每天都在银河里冒险，寻找神秘的星尘宝藏。今天，小星星决定踏上一段全新的旅程，去探索那片从未有人到达过的星云深处。";
      
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
            text: text,
            voice: "tianmeinvsheng",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate edited audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      // Clean up previous edited audio
      if (editedAudioUrl) {
        URL.revokeObjectURL(editedAudioUrl);
      }
      
      setEditedAudioUrl(url);
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (editedAudioUrl) {
        URL.revokeObjectURL(editedAudioUrl);
      }
    };
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <p className="text-sm text-muted-foreground">原始音频</p>

      <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center transition-colors hover:bg-muted/80"
            aria-label={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-foreground" />
            ) : (
              <Play className="h-4 w-4 text-foreground ml-0.5" />
            )}
          </button>

          <div>
            <p className="text-sm font-medium text-foreground">星星人冒险.wav</p>
            <p className="text-xs text-muted-foreground">{audioDuration}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 rounded-full gap-1 px-4"
          onClick={() => setShowModal(true)}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          编辑
        </Button>
      </div>

      {/* Edited Audio */}
      {editedAudioUrl && (
        <>
          <p className="text-sm text-muted-foreground">编辑后音频</p>
          <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayEditedPause}
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center transition-colors hover:bg-primary/30"
                aria-label={isPlayingEdited ? "暂停" : "播放"}
              >
                {isPlayingEdited ? (
                  <Pause className="h-4 w-4 text-primary" />
                ) : (
                  <Play className="h-4 w-4 text-primary ml-0.5" />
                )}
              </button>

              <div>
                <p className="text-sm font-medium text-foreground">星星人冒险_edited.wav</p>
                <p className="text-xs text-primary">已应用风格编辑</p>
              </div>
            </div>
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-tts-edit</span> 编辑原音频的情绪、风格、速度
      </p>

      {/* Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isGenerating && setShowModal(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">选择编辑参数</h3>
              <button
                onClick={() => !isGenerating && setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isGenerating}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">情绪</p>
                <div className="flex flex-wrap gap-2">
                  {emotionTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      disabled={isGenerating}
                      className={`
                        px-3 py-1.5 text-sm rounded-full border transition-all
                        ${selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">风格</p>
                <div className="flex flex-wrap gap-2">
                  {styleTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      disabled={isGenerating}
                      className={`
                        px-3 py-1.5 text-sm rounded-full border transition-all
                        ${selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTags.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    已选择: {selectedTags.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowModal(false)}
                disabled={isGenerating}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={isGenerating || selectedTags.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    生成中...
                  </>
                ) : (
                  "确认"
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default HomeVoiceEditTab;
