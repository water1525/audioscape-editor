import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import avatarFemale from "@/assets/avatar-female.png";
import avatarMale from "@/assets/avatar-male.png";

interface VoiceSample {
  id: string;
  name: string;
  avatar: string;
  originalFile: string;
  clonedFile: string;
  description: string;
}

const voiceSamples: VoiceSample[] = [
  {
    id: "cila",
    name: "Cila",
    avatar: avatarFemale,
    originalFile: "voice-clone/cila-original.mp3",
    clonedFile: "voice-clone/cila-cloned.mp3",
    description: "温柔女声",
  },
  {
    id: "john",
    name: "John",
    avatar: avatarMale,
    originalFile: "voice-clone/john-original.mp3",
    clonedFile: "voice-clone/john-cloned.mp3",
    description: "磁性男声",
  },
];

const HomeVoiceCloneTab = () => {
  const [selectedSample, setSelectedSample] = useState<string>("cila");
  const [playingType, setPlayingType] = useState<"original" | "cloned" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSample = voiceSamples.find((s) => s.id === selectedSample) || voiceSamples[0];

  const getAudioUrl = (filePath: string) => {
    const { data } = supabase.storage.from("audio").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePlay = (type: "original" | "cloned") => {
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

    // Play the selected type
    const filePath = type === "original" ? currentSample.originalFile : currentSample.clonedFile;
    const audio = new Audio(getAudioUrl(filePath));
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingType(null);
      audioRef.current = null;
    };

    audio.play();
    setPlayingType(type);
  };

  const handleSampleChange = (sampleId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingType(null);
    setSelectedSample(sampleId);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Voice Sample Selector */}
      <div className="flex items-center justify-center gap-6">
        {voiceSamples.map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSampleChange(sample.id)}
            className={`
              flex flex-col items-center gap-2.5 rounded-2xl px-6 py-5 transition-all duration-300
              ${selectedSample === sample.id
                ? "bg-primary/5 border border-primary/30 shadow-md shadow-primary/10"
                : "bg-card/40 border border-border/30 hover:bg-card/60 hover:border-border/50"
              }
            `}
          >
            <div
              className={`
                w-16 h-16 rounded-full overflow-hidden bg-background border transition-all duration-300
                ${selectedSample === sample.id ? "border-primary" : "border-border/40"}
              `}
            >
              <img
                src={sample.avatar}
                alt={sample.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className={`
              text-sm font-medium transition-colors
              ${selectedSample === sample.id ? "text-primary" : "text-muted-foreground"}
            `}>
              {sample.name}
            </span>
            <span className="text-xs text-muted-foreground">{sample.description}</span>
          </button>
        ))}
      </div>

      {/* Audio Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Voice */}
        <div className="bg-card/60 border border-border/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">原声</span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">Original</span>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2 h-11 rounded-xl"
            onClick={() => handlePlay("original")}
          >
            {playingType === "original" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {playingType === "original" ? "暂停" : "播放原声"}
          </Button>
        </div>

        {/* Cloned Voice */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-card border border-primary/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">复刻声</span>
            <span className="text-xs text-primary px-2 py-0.5 bg-primary/10 rounded">Cloned</span>
          </div>
          <Button
            className="w-full gap-2 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary"
            onClick={() => handlePlay("cloned")}
          >
            {playingType === "cloned" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {playingType === "cloned" ? "暂停" : "播放复刻"}
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-center text-sm text-muted-foreground">
        使用 <span className="text-foreground font-medium">Step-tts-mini</span> 模型，仅需5秒音频即可复刻任意音色
      </p>
    </div>
  );
};

export default HomeVoiceCloneTab;
