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
  gender: string;
  originalFile: string;
  clonedFile: string;
}

const voiceSamples: VoiceSample[] = [
  {
    id: "cila",
    name: "Cila",
    avatar: avatarFemale,
    gender: "♀",
    originalFile: "voice-clone/cila-original.mp3",
    clonedFile: "voice-clone/cila-cloned.mp3",
  },
  {
    id: "john",
    name: "John",
    avatar: avatarMale,
    gender: "♂",
    originalFile: "voice-clone/john-original.mp3",
    clonedFile: "voice-clone/john-cloned.mp3",
  },
];

const HomeVoiceCloneTab = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudioUrl = (filePath: string) => {
    const { data } = supabase.storage.from("audio").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePlay = (sampleId: string, type: "original" | "cloned") => {
    const playId = `${sampleId}-${type}`;
    
    // If already playing this, pause it
    if (playingId === playId && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Find the sample and play
    const sample = voiceSamples.find(s => s.id === sampleId);
    if (!sample) return;

    const filePath = type === "original" ? sample.originalFile : sample.clonedFile;
    const audio = new Audio(getAudioUrl(filePath));
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.play();
    setPlayingId(playId);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Voice Sample Cards */}
      <div className="flex items-start justify-center gap-6">
        {voiceSamples.map((sample) => (
          <div
            key={sample.id}
            className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/30 px-8 py-6"
          >
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-background">
              <img
                src={sample.avatar}
                alt={sample.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Name and Gender */}
            <div className="text-center">
              <span className="text-base font-medium text-foreground">{sample.name}</span>
              <div className="text-sm text-muted-foreground">{sample.gender}</div>
            </div>

            {/* Play Buttons */}
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="outline"
                className="w-full gap-2 h-10 rounded-lg border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => handlePlay(sample.id, "original")}
              >
                {playingId === `${sample.id}-original` ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {sample.name} 原声
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 h-10 rounded-lg border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => handlePlay(sample.id, "cloned")}
              >
                {playingId === `${sample.id}-cloned` ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {sample.name} 声音复刻
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-left text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-tts-2</span> 生成与原声音一模一样的语音复刻品
      </p>
    </div>
  );
};

export default HomeVoiceCloneTab;
