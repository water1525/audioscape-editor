import { useRef, useEffect, useState } from "react";
import { Play, Pause, Download, RotateCcw, ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AudioPlayerBarProps {
  audioUrl: string | null;
  title: string;
  voiceName: string;
  isVisible: boolean;
  onClose: () => void;
  showSaveVoice?: boolean;
  onSaveVoice?: () => void;
  hideProgressBar?: boolean;
  hideSkipControls?: boolean;
  onTogglePlay?: () => void;
  isPlayingOverride?: boolean;
  durationOverride?: number;
  currentTimeOverride?: number;
}

const AudioPlayerBar = ({
  audioUrl,
  title,
  voiceName,
  isVisible,
  onClose,
  showSaveVoice,
  onSaveVoice,
  hideProgressBar,
  hideSkipControls,
  onTogglePlay,
  isPlayingOverride,
  durationOverride,
  currentTimeOverride,
}: AudioPlayerBarProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (onTogglePlay) {
      onTogglePlay();
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio play failed:", err);
      setIsPlaying(false);
      toast.error("音频播放失败，请重试");
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(audioRef.current.currentTime + seconds, duration)
      );
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `${title || "audio"}.mp3`;
      a.click();
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isVisible || !audioUrl) return null;

  return (
    <div className="fixed bottom-0 left-56 right-0 z-50 bg-card border-t border-l border-border shadow-lg rounded-tl-xl">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          toast.error("音频加载失败，请重新生成");
        }}
      />

      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title and Voice Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {title || "未命名音频"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {voiceName} · 刚刚生成
            </p>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2">
            {/* Skip Back */}
            {!hideSkipControls && (
              <button
                onClick={() => skipTime(-10)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 text-[10px] font-medium">10</span>
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
            >
              {(typeof isPlayingOverride === "boolean" ? isPlayingOverride : isPlaying) ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Skip Forward */}
            {!hideSkipControls && (
              <button
                onClick={() => skipTime(10)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
              >
                <RotateCcw className="w-5 h-5 scale-x-[-1]" />
                <span className="absolute -top-0.5 -left-0.5 text-[10px] font-medium">10</span>
              </button>
            )}
          </div>

          {/* Progress Bar - Conditionally visible */}
          {!hideProgressBar && (
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <span className="text-xs text-muted-foreground min-w-[40px] text-right">
                {formatTime(typeof currentTimeOverride === "number" ? currentTimeOverride : currentTime)}
              </span>
              <div
                className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all duration-100 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground min-w-[40px]">
                {formatTime(typeof durationOverride === "number" ? durationOverride : duration)}
              </span>
            </div>
          )}

          {/* Duration only (no progress bar) */}
          {hideProgressBar && (typeof durationOverride === "number" || duration > 0) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatTime(typeof currentTimeOverride === "number" ? currentTimeOverride : currentTime)}
              </span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(typeof durationOverride === "number" ? durationOverride : duration)}
              </span>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {showSaveVoice && onSaveVoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveVoice}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                保存音色
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-muted-foreground hover:text-foreground"
            >
              <Download className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerBar;
