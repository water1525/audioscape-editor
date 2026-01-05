import { useRef, useEffect, useState } from "react";
import { Download, ChevronDown, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SkipBack10Icon from "@/assets/icon-skip-back-10.svg";
import SkipForward10Icon from "@/assets/icon-skip-forward-10.svg";

// Solid play icon
const SolidPlayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" fill="currentColor" className={className}>
    <path d="M896 512L128 1024V0z" />
  </svg>
);

// Solid pause icon
const SolidPauseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" fill="currentColor" className={className}>
    <path d="M128 0h253.155556v1024H128V0z m512 0h256v1024h-256V0z" />
  </svg>
);

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
  isGenerating?: boolean;
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
  isGenerating,
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
      toast.error("Audio playback failed, please try again");
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

  if (!isVisible || (!audioUrl && !isGenerating)) return null;

  return (
    <div className="fixed bottom-0 left-56 right-0 z-50 bg-card border-t border-l border-border rounded-tl-[3px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          toast.error("Audio loading failed, please regenerate");
        }}
      />

      <div className="px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Left: Play/Pause Button */}
          {isGenerating ? (
            <div className="w-12 h-12 rounded-[3px] bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <button
              onClick={togglePlayPause}
              className={`w-12 h-12 rounded-[3px] flex items-center justify-center transition-colors shrink-0 ${
                (typeof isPlayingOverride === "boolean" ? isPlayingOverride : isPlaying)
                  ? "bg-[#AD0606] hover:bg-[#8a0505] text-white"
                  : "bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,30%)] text-white"
              }`}
            >
              {(typeof isPlayingOverride === "boolean" ? isPlayingOverride : isPlaying) ? (
                <SolidPauseIcon className="w-5 h-5" />
              ) : (
                <SolidPlayIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Title and Voice Info */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {title || "Untitled Audio"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {voiceName} · Just generated
            </p>
          </div>

          {/* Skip controls - small, light gray, positioned left */}
          {!hideSkipControls && (
            <div className="flex items-center gap-4 mr-4">
              <button
                onClick={() => skipTime(-10)}
                className="w-5 h-5 opacity-50 hover:opacity-80 transition-opacity"
                title="Back 10s"
              >
                <img src={SkipBack10Icon} alt="Back 10s" className="w-full h-full" />
              </button>
              <button
                onClick={() => skipTime(10)}
                className="w-5 h-5 opacity-50 hover:opacity-80 transition-opacity"
                title="Forward 10s"
              >
                <img src={SkipForward10Icon} alt="Forward 10s" className="w-full h-full" />
              </button>
            </div>
          )}

          {/* Right section */}
          <div className="shrink-0 flex items-center gap-3">
            {(typeof durationOverride === "number" || duration > 0) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>
                  {formatTime(typeof currentTimeOverride === "number" ? currentTimeOverride : currentTime)}
                </span>
                <span>/</span>
                <span>
                  {formatTime(typeof durationOverride === "number" ? durationOverride : duration)}
                </span>
              </div>
            )}

            {/* Actions */}
            {showSaveVoice && onSaveVoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveVoice}
                disabled={isGenerating}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Voice
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={isGenerating}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isGenerating}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
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
