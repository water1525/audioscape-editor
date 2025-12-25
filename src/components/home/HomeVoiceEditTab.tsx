import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play, X, Loader2, Trash2 } from "lucide-react";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// 参数设置分类
const ganLianTags = ["电台", "纪录", "亲密", "稳健", "大气", "沉稳", "月亮", "阳光", "磁性"];
const fengGeTags = ["严厉", "抒情", "共鸣", "清亮", "质朴", "李庄", "快速"];
const gengDuoTags = ["严肃", "膨胀", "儿童", "平静", "可等", "呼呼", "吹唱", "请读"];
const changYongTags = ["迷人", "法语", "风雨", "浏河", "法语", "中老年", "特别女"];

const HomeVoiceEditTab = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingEdited, setIsPlayingEdited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editedAudioUrl, setEditedAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const editedAudioRef = useRef<HTMLAudioElement | null>(null);
  const { playAudio, stopGlobalAudio } = useGlobalAudio();

  const audioFile = "voice-edit/xinxingren-maoxian.mp3";

  const getAudioUrl = () => {
    const { data } = supabase.storage.from("audio").getPublicUrl(audioFile);
    return data.publicUrl;
  };

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

  const renderTagSection = (title: string, tags: string[]) => (
    <div>
      <p className="text-sm font-medium text-foreground mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <button
            key={`${tag}-${index}`}
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
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* 原始音频标签 */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
        <p className="text-sm text-muted-foreground">原始音频</p>
      </div>

      {/* 原始音频卡片 */}
      <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-colors hover:bg-primary/20"
            aria-label={isPlaying ? "暂停" : "播放"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-primary" />
            ) : (
              <Play className="h-5 w-5 text-primary ml-0.5" />
            )}
          </button>

          {/* 音频波形占位 */}
          <div className="flex items-center gap-0.5 h-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-muted-foreground/40 rounded-full"
                style={{ height: `${12 + Math.random() * 16}px` }}
              />
            ))}
          </div>

          <div className="ml-2">
            <p className="text-sm font-medium text-foreground">星星人冒险.wav</p>
            <p className="text-xs text-muted-foreground">时长 00:10</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 rounded-full gap-1.5 px-4"
          onClick={() => setShowModal(true)}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          编辑
        </Button>
      </div>

      {/* 编辑后的音频标签 */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        <p className="text-sm text-muted-foreground">编辑后的音频</p>
      </div>

      {/* 编辑后的音频卡片 */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePlayEditedPause}
            disabled={!editedAudioUrl}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              editedAudioUrl 
                ? "bg-primary/20 hover:bg-primary/30" 
                : "bg-muted cursor-not-allowed"
            }`}
            aria-label={isPlayingEdited ? "暂停" : "播放"}
          >
            {isPlayingEdited ? (
              <Pause className="h-5 w-5 text-primary" />
            ) : (
              <Play className="h-5 w-5 text-primary ml-0.5" />
            )}
          </button>

          {/* 音频波形占位 */}
          <div className="flex items-center gap-0.5 h-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/40 rounded-full"
                style={{ height: `${12 + Math.random() * 16}px` }}
              />
            ))}
          </div>

          <div className="ml-2">
            <p className="text-sm font-medium text-foreground">星星人冒险_edited.wav</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">时长 00:10</p>
              {editedAudioUrl && (
                <span className="text-xs text-primary font-medium">已编辑</span>
              )}
            </div>
          </div>
        </div>

        {editedAudioUrl && (
          <button
            type="button"
            onClick={() => {
              if (editedAudioRef.current) {
                stopGlobalAudio();
                editedAudioRef.current = null;
                setIsPlayingEdited(false);
              }
              URL.revokeObjectURL(editedAudioUrl);
              setEditedAudioUrl(null);
              toast.success("已删除编辑后的音频");
            }}
            className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-tts-edit</span> 编辑原音频的情绪、风格、速度
      </p>

      {/* 参数设置弹窗 */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isGenerating && setShowModal(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            {/* 标题 */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">参数设置</h3>
              <button
                onClick={() => !isGenerating && setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isGenerating}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 副标题 */}
            <p className="text-sm text-muted-foreground mb-6">
              通配只影响风格标识符，请尽量下载任意风格
            </p>

            {/* 标签分类 */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {renderTagSection("干练", ganLianTags)}
              {renderTagSection("风格", fengGeTags)}
              {renderTagSection("更多", gengDuoTags)}
              {renderTagSection("常用标签", changYongTags)}
            </div>

            {/* 已选择数量 */}
            <p className="text-sm text-muted-foreground mt-4">
              已选择 {selectedTags.length} 个标签
            </p>

            {/* 按钮 */}
            <div className="flex gap-3 mt-4">
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
                disabled={isGenerating}
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
