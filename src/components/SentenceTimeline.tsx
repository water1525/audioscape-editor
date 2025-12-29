import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentenceSegment } from "@/components/VoiceEditTab";
import { toast } from "sonner";

export type SentenceTimelineHandle = {
  togglePlayFrom: (sentenceId?: number | null) => void;
  stop: () => void;
};

interface SentenceTimelineProps {
  sentences: SentenceSegment[];
  onEditSentence: (sentenceId: number) => void;
  onSentencesUpdate: (sentences: SentenceSegment[]) => void;
  onSelectionChange?: (sentenceId: number | null) => void;
  onPlayingChange?: (playingSentenceId: number | null) => void;
  onTimeChange?: (currentTime: number, duration: number) => void;
  onDelete?: () => void;
  editGeneratingId?: number | null;
}

// Individual sentence item component with hover state
interface SentenceItemProps {
  sentence: SentenceSegment;
  isSelected: boolean;
  isPlaying: boolean;
  isGenerating: boolean;
  isEditGenerating: boolean;
  onEdit: (sentenceId: number) => void;
  onClick: (sentence: SentenceSegment) => void;
  onNavigateVersion: (sentenceId: number, direction: "prev" | "next") => void;
  generateWaveformBars: (count: number, isActive: boolean) => JSX.Element[];
}

const SentenceItem = ({
  sentence,
  isSelected,
  isPlaying,
  isGenerating,
  isEditGenerating,
  onEdit,
  onClick,
  onNavigateVersion,
  generateWaveformBars,
}: SentenceItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(sentence)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative flex-shrink-0 min-w-[100px] max-w-[180px] h-12 rounded cursor-pointer
        transition-all duration-200 overflow-hidden group
        ${isSelected || isPlaying
          ? "bg-primary/20 ring-2 ring-primary"
          : sentence.isEdited
            ? "bg-primary/10 hover:bg-primary/15"
            : "bg-secondary/80 hover:bg-secondary"
        }
      `}
    >
      {/* Waveform background */}
      <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-1">
        {generateWaveformBars(16, isSelected || isPlaying)}
      </div>

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center px-2 bg-gradient-to-t from-background/90 via-background/50 to-transparent">
        <p
          className={`text-xs line-clamp-2 leading-tight ${
            isSelected || isPlaying
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          }`}
        >
          {sentence.text}
        </p>
      </div>

      {/* Edit button / loading / edited state */}
      {isEditGenerating ? (
        // Show loading state during generation
        <div className="absolute top-0.5 right-0.5 z-10">
          <div className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-md flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>生成中</span>
          </div>
        </div>
      ) : sentence.isEdited ? (
        // Always show "已编辑" button for edited sentences
        <div className="absolute top-0.5 right-0.5 z-10">
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(sentence.id);
            }}
            className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            已编辑
          </Button>
        </div>
      ) : (isHovered || isSelected) && !isGenerating ? (
        // Show "编辑" button on hover or when selected for non-edited sentences
        <div className="absolute top-0.5 right-0.5 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(sentence.id);
            }}
            className="h-5 px-1.5 text-[10px] bg-background/90 hover:bg-background"
          >
            编辑
          </Button>
        </div>
      ) : null}

      {/* Generating indicator */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}

      {/* Playing indicator */}
      {isPlaying && !isGenerating && !isHovered && (
        <div className="absolute bottom-1 left-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${6 + i * 2}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Version navigation for edited sentences */}
      {sentence.isEdited && sentence.versions.length > 1 && isSelected && !isHovered && (
        <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigateVersion(sentence.id, "prev");
            }}
            disabled={sentence.currentVersionIndex <= 0}
            className="h-4 w-4 flex items-center justify-center rounded bg-background/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-2.5 w-2.5" />
          </button>
          <span className="text-[8px] text-muted-foreground">
            {sentence.currentVersionIndex + 1}/{sentence.versions.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigateVersion(sentence.id, "next");
            }}
            disabled={sentence.currentVersionIndex >= sentence.versions.length - 1}
            className="h-4 w-4 flex items-center justify-center rounded bg-background/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
};

const SentenceTimeline = forwardRef<SentenceTimelineHandle, SentenceTimelineProps>(
  ({
    sentences,
    onEditSentence,
    onSentencesUpdate,
    onSelectionChange,
    onPlayingChange,
    onTimeChange,
    onDelete,
    editGeneratingId,
  }, ref) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [generatingId, setGeneratingId] = useState<number | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playQueueRef = useRef<number[]>([]);
    const sentencesRef = useRef(sentences);
    const audioUrlCacheRef = useRef<Map<number, string>>(new Map());
    const totalDurationRef = useRef(0);
    const playedDurationRef = useRef(0);

    useEffect(() => {
      sentencesRef.current = sentences;
    }, [sentences]);

    useEffect(() => {
      onSelectionChange?.(selectedId);
    }, [selectedId, onSelectionChange]);

    useEffect(() => {
      onPlayingChange?.(playingId);
    }, [playingId, onPlayingChange]);

    useEffect(() => {
      if (selectedId === null && sentences.length > 0) {
        setSelectedId(sentences[0].id);
      }
    }, [sentences, selectedId]);

    const stop = useCallback(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      playQueueRef.current = [];
      setPlayingId(null);
      setGeneratingId(null);
    }, []);

    // Generate audio for a sentence via TTS
    const generateAudioForSentence = useCallback(async (sentence: SentenceSegment): Promise<string | null> => {
      // Check cache first
      const cached = audioUrlCacheRef.current.get(sentence.id);
      if (cached) return cached;

      // If already has edited version, use that
      if (sentence.isEdited && sentence.versions.length > 0) {
        const url = sentence.versions[sentence.currentVersionIndex]?.url;
        if (url) {
          audioUrlCacheRef.current.set(sentence.id, url);
          return url;
        }
      }

      setGeneratingId(sentence.id);

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
          throw new Error("Failed to generate audio");
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        audioUrlCacheRef.current.set(sentence.id, url);
        return url;
      } catch (error) {
        console.error("Error generating audio for sentence:", error);
        // Silently fail without showing toast
        return null;
      } finally {
        setGeneratingId(null);
      }
    }, []);

    const playNextInQueue = useCallback(async () => {
      if (playQueueRef.current.length === 0) {
        setPlayingId(null);
        onTimeChange?.(0, totalDurationRef.current);
        return;
      }

      const nextId = playQueueRef.current.shift()!;
      const currentSentences = sentencesRef.current;
      const sentence = currentSentences.find((s) => s.id === nextId);

      if (!sentence) {
        playNextInQueue();
        return;
      }

      setSelectedId(nextId);
      setPlayingId(nextId);

      // Get or generate audio
      const audioUrl = await generateAudioForSentence(sentence);
      if (!audioUrl) {
        playNextInQueue();
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        // Update total duration estimation
      };

      audio.ontimeupdate = () => {
        const current = playedDurationRef.current + (audio.currentTime || 0);
        onTimeChange?.(current, totalDurationRef.current);
      };

      audio.onended = () => {
        playedDurationRef.current += audio.duration || 0;
        playNextInQueue();
      };

      audio.onerror = () => {
        playNextInQueue();
      };

      audio.play().catch(() => playNextInQueue());
    }, [generateAudioForSentence, onTimeChange]);

    const startQueueFrom = useCallback(
      async (startId: number) => {
        stop();

        const currentSentences = sentencesRef.current;
        const startIndex = currentSentences.findIndex((s) => s.id === startId);
        if (startIndex === -1) return;

        // Include all sentences from startId to end
        const queue = currentSentences.slice(startIndex).map((s) => s.id);

        if (queue.length === 0) {
          setPlayingId(null);
          return;
        }

        // Estimate total duration (rough: 2 seconds per sentence as placeholder)
        totalDurationRef.current = queue.length * 2;
        playedDurationRef.current = 0;

        playQueueRef.current = queue;
        playNextInQueue();
      },
      [playNextInQueue, stop]
    );

    const togglePlayFrom = useCallback(
      (sentenceId?: number | null) => {
        if (playingId !== null || generatingId !== null) {
          stop();
          return;
        }

        const startId =
          typeof sentenceId === "number" ? sentenceId : selectedId ?? null;
        if (startId === null) return;

        setSelectedId(startId);
        startQueueFrom(startId);
      },
      [playingId, generatingId, selectedId, startQueueFrom, stop]
    );

    useImperativeHandle(
      ref,
      () => ({
        togglePlayFrom,
        stop,
      }),
      [togglePlayFrom, stop]
    );

    const generateWaveformBars = useCallback((count: number, isActive: boolean) => {
      return Array.from({ length: count }, (_, i) => {
        const height = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 20;
        return (
          <div
            key={i}
            className={`w-0.5 rounded-full transition-colors ${
              isActive ? "bg-primary/60" : "bg-muted-foreground/30"
            }`}
            style={{ height: `${height}%` }}
          />
        );
      });
    }, []);

    const navigateVersion = (sentenceId: number, direction: "prev" | "next") => {
      const updated = sentences.map((s) => {
        if (s.id === sentenceId && s.versions.length > 0) {
          let newIndex = s.currentVersionIndex;
          if (direction === "prev") {
            newIndex = Math.max(0, newIndex - 1);
          } else {
            newIndex = Math.min(s.versions.length - 1, newIndex + 1);
          }
          // Clear cache for this sentence when version changes
          audioUrlCacheRef.current.delete(sentenceId);
          return { ...s, currentVersionIndex: newIndex };
        }
        return s;
      });
      onSentencesUpdate(updated);
    };

    const handleClick = (sentence: SentenceSegment) => {
      setSelectedId(sentence.id);
      if (playingId !== null) {
        startQueueFrom(sentence.id);
      }
    };

    useEffect(() => {
      return () => {
        stop();
        // Clean up cached URLs
        audioUrlCacheRef.current.forEach((url) => {
          URL.revokeObjectURL(url);
        });
        audioUrlCacheRef.current.clear();
      };
    }, [stop]);

    if (sentences.length === 0) return null;

    return (
      <div className="fixed bottom-[68px] left-56 right-0 z-40 bg-card border-t border-l border-border rounded-tl-xl">
        {/* Horizontal sentence segments */}
        <div className="px-6 py-3">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {sentences.map((sentence) => (
              <SentenceItem
                key={sentence.id}
                sentence={sentence}
                isSelected={selectedId === sentence.id}
                isPlaying={playingId === sentence.id}
                isGenerating={generatingId === sentence.id}
                isEditGenerating={editGeneratingId === sentence.id}
                onEdit={onEditSentence}
                onClick={handleClick}
                onNavigateVersion={navigateVersion}
                generateWaveformBars={generateWaveformBars}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SentenceTimeline.displayName = "SentenceTimeline"; // v2

export default SentenceTimeline;
