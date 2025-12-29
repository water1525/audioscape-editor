import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentenceSegment } from "@/components/VoiceEditTab";

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
}

const SentenceTimeline = forwardRef<SentenceTimelineHandle, SentenceTimelineProps>(
  ({
    sentences,
    onEditSentence,
    onSentencesUpdate,
    onSelectionChange,
    onPlayingChange,
  }, ref) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playQueueRef = useRef<number[]>([]);
    const sentencesRef = useRef(sentences);

    useEffect(() => {
      sentencesRef.current = sentences;
    }, [sentences]);

    // Keep parent in sync
    useEffect(() => {
      onSelectionChange?.(selectedId);
    }, [selectedId, onSelectionChange]);

    useEffect(() => {
      onPlayingChange?.(playingId);
    }, [playingId, onPlayingChange]);

    // Auto-select first sentence when available
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
    }, []);

    const playNextInQueue = useCallback(() => {
      if (playQueueRef.current.length === 0) {
        setPlayingId(null);
        return;
      }

      const nextId = playQueueRef.current.shift()!;
      const currentSentences = sentencesRef.current;
      const sentence = currentSentences.find((s) => s.id === nextId);

      if (!sentence || !sentence.isEdited || sentence.versions.length === 0) {
        playNextInQueue();
        return;
      }

      const currentVersion = sentence.versions[sentence.currentVersionIndex];
      if (!currentVersion) {
        playNextInQueue();
        return;
      }

      setSelectedId(nextId);
      setPlayingId(nextId);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(currentVersion.url);
      audioRef.current = audio;

      audio.onended = () => playNextInQueue();
      audio.onerror = () => playNextInQueue();

      audio.play().catch(() => playNextInQueue());
    }, []);

    const startQueueFrom = useCallback(
      (startId: number) => {
        stop();

        const currentSentences = sentencesRef.current;
        const startIndex = currentSentences.findIndex((s) => s.id === startId);
        if (startIndex === -1) return;

        const playable = currentSentences
          .slice(startIndex)
          .filter((s) => s.isEdited && s.versions.length > 0)
          .map((s) => s.id);

        if (playable.length === 0) {
          setPlayingId(null);
          return;
        }

        playQueueRef.current = playable;
        playNextInQueue();
      },
      [playNextInQueue, stop]
    );

    const togglePlayFrom = useCallback(
      (sentenceId?: number | null) => {
        if (playingId !== null) {
          stop();
          return;
        }

        const startId =
          typeof sentenceId === "number" ? sentenceId : selectedId ?? null;
        if (startId === null) return;

        setSelectedId(startId);
        startQueueFrom(startId);
      },
      [playingId, selectedId, startQueueFrom, stop]
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
          return { ...s, currentVersionIndex: newIndex };
        }
        return s;
      });
      onSentencesUpdate(updated);
    };

    const handleClick = (sentence: SentenceSegment) => {
      setSelectedId(sentence.id);
      // If user selects another sentence during playback, jump to it.
      if (playingId !== null) {
        startQueueFrom(sentence.id);
      }
    };

    useEffect(() => {
      return () => {
        stop();
      };
    }, [stop]);

    if (sentences.length === 0) return null;

    return (
      <div className="fixed bottom-[68px] left-56 right-0 z-40 bg-card border-t border-l border-border rounded-tl-xl">
        {/* Selected sentence detail */}
        {selectedId !== null && (() => {
          const sentence = sentences.find((s) => s.id === selectedId);
          if (!sentence) return null;
          return (
            <div className="px-6 py-2 flex items-center justify-between gap-4 border-b border-border/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{sentence.text}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {sentence.isEdited && sentence.versions.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => navigateVersion(sentence.id, "prev")}
                      disabled={sentence.currentVersionIndex <= 0}
                      className="h-6 w-6"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[50px] text-center">
                      v{sentence.currentVersionIndex + 1}/{sentence.versions.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => navigateVersion(sentence.id, "next")}
                      disabled={
                        sentence.currentVersionIndex >= sentence.versions.length - 1
                      }
                      className="h-6 w-6"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditSentence(sentence.id)}
                  className="h-7 text-xs"
                >
                  编辑
                </Button>
              </div>
            </div>
          );
        })()}

        {/* Horizontal sentence segments */}
        <div className="px-6 py-2">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {sentences.map((sentence) => {
              const isSelected = selectedId === sentence.id;
              const isPlaying = playingId === sentence.id;

              return (
                <div
                  key={sentence.id}
                  onClick={() => handleClick(sentence)}
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

                  {/* Edited badge */}
                  {sentence.isEdited && (
                    <div className="absolute top-0.5 right-0.5">
                      <span className="px-1 py-0.5 text-[9px] bg-primary text-primary-foreground rounded">
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
                              height: `${6 + i * 2}px`,
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
        </div>
      </div>
    );
  }
);

SentenceTimeline.displayName = "SentenceTimeline";

export default SentenceTimeline;
