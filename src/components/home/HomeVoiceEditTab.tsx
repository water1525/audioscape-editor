import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HomeVoiceEditTab = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playAudio, stopGlobalAudio } = useGlobalAudio();

  // Use one of the existing audio files as demo for voice edit
  const audioFile = "tts/case2.mp3";

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

    // Stop any global audio first
    stopGlobalAudio();
    
    // Play actual audio
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
            <p className="text-xs text-muted-foreground">00:10</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="h-9 rounded-full gap-1 px-4">
          <ArrowRight className="h-3.5 w-3.5" />
          编辑
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-tts-edit</span> 编辑原音频的情绪、风格、速度
      </p>
    </div>
  );
};

export default HomeVoiceEditTab;
