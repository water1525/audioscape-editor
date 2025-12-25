import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { toast } from "sonner";
import avatarFemale from "@/assets/avatar-female.png";
import avatarMale from "@/assets/avatar-male.png";

const voiceProfiles = [
  {
    id: "cila",
    name: "Cila",
    gender: "♀",
    avatar: avatarFemale,
    original: "Cila 原声",
    cloned: "Cila 声音复刻",
    originalAudio: "/audio/cila-original.mp3",
    clonedAudio: "/audio/cila-cloned.mp3",
  },
  {
    id: "john",
    name: "John",
    gender: "♂",
    avatar: avatarMale,
    original: "John 原声",
    cloned: "John 声音复刻",
    originalAudio: "/audio/john-original.mp3",
    clonedAudio: "/audio/john-cloned.mp3",
  },
];

const VoiceCloneTab = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (profileId: string, type: "original" | "cloned") => {
    const buttonId = `${profileId}-${type}`;
    const profile = voiceProfiles.find((p) => p.id === profileId);
    if (!profile) return;

    if (playingId === buttonId && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }

    const audioUrl = type === "original" ? profile.originalAudio : profile.clonedAudio;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingId(null);
      audioRef.current = null;
      toast.error("音频文件不存在，请先生成音频");
    };

    audio.play().catch(() => {
      setPlayingId(null);
      audioRef.current = null;
      toast.error("音频播放失败");
    });
    setPlayingId(buttonId);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-6 mb-6">
        {voiceProfiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-card border border-border rounded-lg p-4 shadow-soft hover:shadow-medium transition-shadow duration-200"
          >
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-foreground">{profile.name}</span>
              <span className="text-xs text-primary">{profile.gender}</span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="play"
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => handlePlayPause(profile.id, "original")}
              >
                {playingId === `${profile.id}-original` ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {profile.original}
              </Button>
              <Button
                variant="play"
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => handlePlayPause(profile.id, "cloned")}
              >
                {playingId === `${profile.id}-cloned` ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {profile.cloned}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-tts-2</span> 生成与原声音一模一样的语音复刻品
      </p>
    </div>
  );
};

export default VoiceCloneTab;
