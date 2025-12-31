import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play, X, Loader2, Trash2 } from "lucide-react";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import WaveformAnimation from "@/components/ui/WaveformAnimation";

// Parameter settings categories
const emotionTags = ["Happy", "Angry", "Sad", "Humorous", "Confused", "Disgusted", "Empathetic", "Awkward", "Fearful", "Surprised", "Excited", "Frustrated", "Indifferent", "Admiring"];
const styleTags = [
  "Serious", "Arrogant", "Childlike", "Innocent", "Exaggerated", "Youthful", "Mature", "Reciting",
  "Sweet", "Ethereal", "Bold", "Coy", "Warm", "Shy", "Comforting", "Authoritative",
  "Casual", "Radio", "Affectionate", "Gentle", "Magnetic", "Elderly", "Whispering",
  "Bubble", "Storytelling", "Vivid", "Hosting", "News", "Advertising",
  "Gossip", "Shouting", "Soft", "Loud", "Deep", "High-pitched"
];
const speedTags = ["Fast", "Slow", "Faster", "Slower"];

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
      toast.error("Audio playback failed");
    };

    audio.play().catch(() => {
      setIsPlaying(false);
      toast.error("Audio playback failed");
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
      toast.error("Audio playback failed");
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
      toast.error("Please select at least one edit parameter");
      return;
    }
    
    // Close modal immediately and show generating state
    setShowModal(false);
    setIsGenerating(true);
    const tagsCount = selectedTags.length;
    setSelectedTags([]);
    
    try {
      // Star adventure story text
      const text = "In the distant starry sky, there lived a group of adorable star people. Every day they explored the galaxy, searching for mysterious stardust treasures. Today, little star decided to embark on a brand new journey to explore the depths of a nebula no one had ever reached before.";
      
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
      
      toast.success(`Audio edited successfully with ${tagsCount} style tags applied`);
    } catch (error) {
      console.error("Error generating edited audio:", error);
      toast.error("Audio editing failed. Please try again.");
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
      <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <button
            key={`${tag}-${index}`}
            onClick={() => toggleTag(tag)}
            disabled={isGenerating}
            className={`
              px-3 py-1.5 text-sm rounded-[3px] border transition-all
              ${selectedTags.includes(tag)
                ? "bg-[hsl(221,100%,43%)] text-white border-[hsl(221,100%,43%)]"
                : "bg-card border-border text-muted-foreground hover:border-[hsl(221,100%,43%)]/50 hover:text-foreground"
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
      {/* Original audio label */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-foreground font-semibold">Original Audio</p>
      </div>

      {/* Original audio card */}
      <div className="bg-card border border-border/50 rounded-[3px] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-colors hover:bg-primary/20"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-primary" />
            ) : (
              <Play className="h-5 w-5 text-primary ml-0.5" />
            )}
          </button>

          {/* Audio waveform */}
          <WaveformAnimation 
            isPlaying={isPlaying} 
            variant="default" 
            barCount={8} 
            className="mx-2"
          />

          <div className="ml-2">
            <p className="text-sm font-medium text-foreground">Star Adventure.wav</p>
            <p className="text-xs text-muted-foreground">Duration 00:10</p>
          </div>
        </div>

        <Button 
          variant="default" 
          size="sm" 
          className="h-9 rounded-[3px] gap-1.5 px-4 bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white font-semibold"
          onClick={() => setShowModal(true)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating
            </>
          ) : (
            <>
              <ArrowRight className="h-3.5 w-3.5" />
              Edit
            </>
          )}
        </Button>
      </div>

      {/* Edited audio - only show when available */}
      {editedAudioUrl && (
        <>
          {/* Edited audio label */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">Edited Audio</p>
          </div>

          {/* Edited audio card */}
          <div className="bg-primary/5 border border-primary/20 rounded-[3px] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayEditedPause}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-primary/20 hover:bg-primary/30"
                aria-label={isPlayingEdited ? "Pause" : "Play"}
              >
                {isPlayingEdited ? (
                  <Pause className="h-5 w-5 text-primary" />
                ) : (
                  <Play className="h-5 w-5 text-primary ml-0.5" />
                )}
              </button>

            {/* Audio waveform */}
            <WaveformAnimation 
              isPlaying={isPlayingEdited} 
              variant="primary" 
              barCount={8} 
              className="mx-2"
            />

              <div className="ml-2">
                <p className="text-sm font-medium text-foreground">Star Adventure_edited.wav</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Duration 00:10</p>
                  <span className="text-xs text-primary font-medium">Edited</span>
                </div>
              </div>
            </div>

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
                toast.success("Edited audio deleted");
              }}
              className="p-2 rounded-[3px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-Audio-EditX</span> Edit emotion, style, and speed of original audio
      </p>

      {/* Parameter settings modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isGenerating && setShowModal(false)}
          />
          <div className="relative bg-card border border-border rounded-[3px] p-6 w-full max-w-md mx-4 shadow-2xl">
            {/* Title */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">Parameter Settings</h3>
              <button
                onClick={() => !isGenerating && setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isGenerating}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground mb-6">
              Select your desired voice characteristics
            </p>

            {/* Tag categories */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {renderTagSection("Emotion", emotionTags)}
              {renderTagSection("Style", styleTags)}
              {renderTagSection("Speed Control", speedTags)}
            </div>


            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1 font-semibold"
                onClick={() => setShowModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#C23A2B] hover:bg-[#A83225] text-white font-semibold"
                onClick={handleConfirm}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  "Confirm"
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
