import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Original and edited text content for "星星人冒险"
const originalText = "在遥远的银河系，有一个叫星星人的小家伙。他住在一颗闪闪发光的星球上，每天都梦想着去探索宇宙的奥秘。";
const editedText = "在遥远的银河系，有一个叫星星人的小家伙。他住在一颗闪闪发光的星球上，每天都梦想着去探索宇宙的奥秘。";

// Editing tags that were applied
const appliedTags = ["温柔", "童话", "治愈"];

const HomeVoiceEditTab = () => {
  const [playingType, setPlayingType] = useState<"original" | "edited" | null>(null);
  const [isLoading, setIsLoading] = useState<"original" | "edited" | null>(null);
  const [audioUrls, setAudioUrls] = useState<{ original?: string; edited?: string }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate audio on demand
  const generateAudio = async (type: "original" | "edited") => {
    setIsLoading(type);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/step-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: type === "original" ? originalText : editedText,
          voice: type === "original" ? "cixingnansheng" : "tianmeinvsheng",
        }),
      });

      if (!response.ok) {
        throw new Error("生成音频失败");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      setAudioUrls(prev => ({ ...prev, [type]: url }));
      return url;
    } catch (error) {
      console.error("Audio generation error:", error);
      toast.error("音频生成失败，请重试");
      return null;
    } finally {
      setIsLoading(null);
    }
  };

  const handlePlay = async (type: "original" | "edited") => {
    // If already playing this type, pause it
    if (playingType === type && audioRef.current) {
      audioRef.current.pause();
      setPlayingType(null);
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Get or generate audio URL
    let url = audioUrls[type];
    if (!url) {
      url = await generateAudio(type);
      if (!url) return;
    }

    // Play the audio
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingType(null);
      audioRef.current = null;
    };

    audio.play();
    setPlayingType(type);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrls.original) URL.revokeObjectURL(audioUrls.original);
      if (audioUrls.edited) URL.revokeObjectURL(audioUrls.edited);
    };
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Story Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-1">星星人冒险</h3>
        <p className="text-sm text-muted-foreground">童话故事片段</p>
      </div>

      {/* Text Display */}
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-foreground leading-relaxed">
          {originalText}
        </p>
      </div>

      {/* Applied Tags */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">编辑效果：</span>
        {appliedTags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Audio Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original Voice */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">原始音频</span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">Before</span>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => handlePlay("original")}
            disabled={isLoading !== null}
          >
            {isLoading === "original" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playingType === "original" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isLoading === "original" ? "生成中..." : playingType === "original" ? "暂停" : "播放原音"}
          </Button>
        </div>

        {/* Edited Voice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">编辑后音频</span>
            <span className="text-xs text-primary px-2 py-0.5 bg-primary/10 rounded">After</span>
          </div>
          <Button
            className="w-full gap-2"
            onClick={() => handlePlay("edited")}
            disabled={isLoading !== null}
          >
            {isLoading === "edited" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playingType === "edited" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isLoading === "edited" ? "生成中..." : playingType === "edited" ? "暂停" : "播放编辑后"}
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-center text-sm text-muted-foreground">
        使用 <span className="text-foreground font-medium">Step-tts-2</span> 模型，智能调整语音风格和情感
      </p>
    </div>
  );
};

export default HomeVoiceEditTab;
