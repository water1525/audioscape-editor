import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, Loader2, PenLine, Pencil } from "lucide-react";
import DeleteIcon from "@/components/ui/DeleteIcon";
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
  onEditAll?: () => void;
  onDelete?: () => void;
  onSentencesUpdate: (sentences: SentenceSegment[]) => void;
  onSelectionChange?: (sentenceId: number | null) => void;
  onPlayingChange?: (playingSentenceId: number | null) => void;
  onTimeChange?: (currentTime: number, duration: number) => void;
  editGeneratingId?: number | null;
  isBatchGenerating?: boolean;
  batchProgress?: { current: number; total: number };
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
        relative flex-shrink-0 w-[220px] h-20 rounded-[3px] cursor-pointer
        transition-all duration-200 overflow-hidden group
        ${isSelected || isPlaying
          ? "bg-primary/10"
          : sentence.isEdited
            ? "bg-primary/5 hover:bg-primary/10"
            : "bg-secondary/50 hover:bg-secondary/70"
        }
      `}
    >
      {/* Text at top */}
      <div className="absolute top-2 left-2 right-2 z-10">
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


      {/* Edit button / loading / edited state - positioned at bottom right */}
      {isEditGenerating ? (
        // Show loading state during generation
        <div className="absolute bottom-1.5 right-1.5 z-10">
          <div className="h-5 px-1.5 text-[10px] bg-[hsl(221,100%,43%)] text-white rounded-[3px] flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Generating</span>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-1">
          {/* Non-clickable "Edited" text label for edited sentences */}
          {sentence.isEdited && (
            <span className="text-[10px] text-[hsl(221,100%,43%)] font-medium">
              Edited
            </span>
          )}
          {/* Pencil edit button - show on hover or selected */}
          {(isHovered || isSelected) && !isGenerating && (
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(sentence.id);
              }}
              className="h-5 w-5 bg-white hover:bg-[#CCCCCC] border-border"
            >
              <PenLine className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Generating indicator */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}

      {/* Playing indicator - bottom left */}
      {isPlaying && !isGenerating && !isHovered && (
        <div className="absolute bottom-1.5 left-1.5">
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
            className="h-4 w-4 flex items-center justify-center rounded-[3px] bg-background/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
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
            className="h-4 w-4 flex items-center justify-center rounded-[3px] bg-background/80 text-muted-foreground hover:text-foreground disabled:opacity-30"
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
    onEditAll,
    onDelete,
    onSentencesUpdate,
    onSelectionChange,
    onPlayingChange,
    onTimeChange,
    editGeneratingId,
    isBatchGenerating,
    batchProgress,
  }, ref) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [generatingId, setGeneratingId] = useState<number | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

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

    // Check scroll state
    const checkScrollState = useCallback(() => {
      const container = scrollContainerRef.current;
      if (container) {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 1
        );
      }
    }, []);

    useEffect(() => {
      checkScrollState();
      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener('scroll', checkScrollState);
        window.addEventListener('resize', checkScrollState);
        return () => {
          container.removeEventListener('scroll', checkScrollState);
          window.removeEventListener('resize', checkScrollState);
        };
      }
    }, [checkScrollState, sentences]);

    const scrollLeft = () => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollBy({ left: -300, behavior: 'smooth' });
      }
    };

    const scrollRight = () => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollBy({ left: 300, behavior: 'smooth' });
      }
    };

    if (sentences.length === 0) return null;

    return (
      <div className="fixed bottom-[68px] left-56 right-0 z-40 bg-card border-t border-l border-border rounded-tl-[3px]">
        {/* Horizontal sentence segments with navigation */}
        <div className="px-6 py-3 flex items-center gap-2">
          {/* Left scroll button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Scrollable container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1"
          >
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

          {/* Right scroll button */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : ''}`}
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Edit All button */}
          {onEditAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditAll}
              disabled={isBatchGenerating}
              className="h-8 gap-1.5 shrink-0"
            >
              {isBatchGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating ({batchProgress?.current || 0}/{batchProgress?.total || 0})
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit All
                </>
              )}
            </Button>
          )}

          {/* Delete button */}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isBatchGenerating}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <DeleteIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

SentenceTimeline.displayName = "SentenceTimeline"; // v2

export default SentenceTimeline;
