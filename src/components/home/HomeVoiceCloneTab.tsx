import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import WaveformAnimation from "@/components/ui/WaveformAnimation";
import avatarFemale from "@/assets/avatar-female.png";
import avatarMale from "@/assets/avatar-male.png";
import iconFemale from "@/assets/icon-female.svg";
import iconMale from "@/assets/icon-male.svg";

interface VoiceSample {
  id: string;
  name: string;
  avatar: string;
  genderIcon: string;
  originalFile: string;
  clonedFile: string;
  bgColor: string;
  roundedClass: string;
}

const voiceSamples: VoiceSample[] = [
  {
    id: "cila",
    name: "Cila",
    avatar: avatarFemale,
    genderIcon: iconFemale,
    originalFile: "voice-clone/cila-original.mp3",
    clonedFile: "voice-clone/cila-cloned.mp3",
    bgColor: "bg-[#FFECEC]",
    roundedClass: "rounded-l-[3px] rounded-r-none",
  },
  {
    id: "john",
    name: "John",
    avatar: avatarMale,
    genderIcon: iconMale,
    originalFile: "voice-clone/john-original.mp3",
    clonedFile: "voice-clone/john-cloned.mp3",
    bgColor: "bg-[#ECF0FF]",
    roundedClass: "rounded-r-[3px] rounded-l-none",
  },
];

const HomeVoiceCloneTab = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playAudio, stopGlobalAudio } = useGlobalAudio();

  const getAudioUrl = (filePath: string) => {
    const { data } = supabase.storage.from("audio").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePlay = (sampleId: string, type: "original" | "cloned") => {
    const playId = `${sampleId}-${type}`;
    
    // If already playing this, pause it
    if (playingId === playId && audioRef.current) {
      stopGlobalAudio();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }

    // Stop any global audio
    stopGlobalAudio();

    // Find the sample and play
    const sample = voiceSamples.find(s => s.id === sampleId);
    if (!sample) return;

    const filePath = type === "original" ? sample.originalFile : sample.clonedFile;
    const audio = new Audio(getAudioUrl(filePath));
    audioRef.current = audio;
    
    // Register with global audio manager
    playAudio(audio, () => {
      setPlayingId(null);
      audioRef.current = null;
    });

    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.play();
    setPlayingId(playId);
  };

  return (
    <div className="animate-fade-in">
      {/* Combined Card with Voice Samples and Description */}
      <div className="px-8 py-6">
        {/* Voice Sample Cards */}
        <div className="flex items-center justify-center">
          {voiceSamples.map((sample) => (
            <div
              key={sample.id}
              className={`flex flex-col items-center gap-3 ${sample.bgColor} ${sample.roundedClass} px-8 py-6`}
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
              <div className="flex flex-col items-center gap-1">
                <span className="text-base font-medium text-foreground">{sample.name}</span>
                <img src={sample.genderIcon} alt="gender" className="w-5 h-5" />
              </div>

              {/* Play Buttons */}
              <div className="flex flex-col w-full overflow-hidden rounded-[3px]">
                <Button
                  variant="default"
                  className="w-full gap-2 h-12 rounded-none bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white"
                  onClick={() => handlePlay(sample.id, "original")}
                >
                  {playingId === `${sample.id}-original` ? (
                    <>
                      <WaveformAnimation isPlaying={true} variant="small" barCount={4} className="[&>div]:bg-white" />
                      <span className="ml-1">{sample.name} Original</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      {sample.name} Original
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  className="w-full gap-2 h-12 rounded-none bg-[#AD0606] hover:bg-[#8a0505] text-white"
                  onClick={() => handlePlay(sample.id, "cloned")}
                >
                  {playingId === `${sample.id}-cloned` ? (
                    <>
                      <WaveformAnimation isPlaying={true} variant="small" barCount={4} className="[&>div]:bg-white" />
                      <span className="ml-1">{sample.name} Cloned</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      {sample.name} Cloned
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Horizontal Separator */}
        <div className="w-full h-px bg-border/50 my-6" />

        {/* Description */}
        <p className="text-left text-sm text-muted-foreground">
          <span className="text-foreground font-medium">@Step-tts-2</span> Generate voice clones that sound identical to the original
        </p>
      </div>
    </div>
  );
};

export default HomeVoiceCloneTab;
