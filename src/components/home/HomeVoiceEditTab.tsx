import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, ArrowRight } from "lucide-react";

const HomeVoiceEditTab = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = () => {
    // This is a demo - no actual audio playback
    setIsPlaying(!isPlaying);
    
    // Auto reset after 2 seconds for demo purposes
    if (!isPlaying) {
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Section Title */}
      <p className="text-sm text-muted-foreground">原始音频</p>

      {/* Audio File Card */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Play Button */}
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-foreground" />
            ) : (
              <Play className="h-4 w-4 text-foreground ml-0.5" />
            )}
          </button>
          
          {/* File Info */}
          <div>
            <p className="text-sm font-medium text-foreground">星星人冒险.wav</p>
            <p className="text-xs text-muted-foreground">00:10</p>
          </div>
        </div>

        {/* Edit Button */}
        <Button variant="outline" size="sm" className="gap-1">
          <ArrowRight className="h-3 w-3" />
          编辑
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-tts-edit</span> 编辑原音频的情绪、风格、速度
      </p>
    </div>
  );
};

export default HomeVoiceEditTab;
