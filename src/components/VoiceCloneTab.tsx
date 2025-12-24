import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";
import avatarFemale from "@/assets/avatar-female.png";
import avatarMale from "@/assets/avatar-male.png";

const SUPABASE_URL = "https://vixczylcdviqivlziovw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpeGN6eWxjZHZpcWl2bHppb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzQ0NzAsImV4cCI6MjA4MjE1MDQ3MH0.XKpCSVe3ctAZgjfh90W_x6mdA-lqcJRHUndy4LXROkg";

const voiceProfiles = [
  {
    id: "cila",
    name: "Cila",
    gender: "♀",
    avatar: avatarFemale,
    original: "Cila 原声",
    cloned: "Cila 声音复刻",
    sampleText: "大家好，我是Cila，很高兴认识你。今天天气真不错，希望你有愉快的一天！",
    voice: "tianmeinvsheng",
  },
  {
    id: "john",
    name: "John",
    gender: "♂",
    avatar: avatarMale,
    original: "John 原声",
    cloned: "John 声音复刻",
    sampleText: "你好，我是John，欢迎来到我们的语音平台。让我为你展示一下语音合成的魅力。",
    voice: "cixingnansheng",
  },
];

const VoiceCloneTab = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [loadingCache, setLoadingCache] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio for all profiles
  useEffect(() => {
    voiceProfiles.forEach(async (profile) => {
      const types = ['original', 'cloned'] as const;
      for (const type of types) {
        const cacheKey = `${profile.id}-${type}`;
        if (audioCache[cacheKey]) continue;
        
        setLoadingCache(prev => ({ ...prev, [cacheKey]: true }));
        try {
          const response = await fetch(
            `${SUPABASE_URL}/functions/v1/step-tts`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ 
                text: profile.sampleText,
                voice: profile.voice,
              }),
            }
          );

          if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioCache(prev => ({ ...prev, [cacheKey]: audioUrl }));
          }
        } catch (error) {
          console.error("Preload error:", error);
        } finally {
          setLoadingCache(prev => ({ ...prev, [cacheKey]: false }));
        }
      }
    });
  }, []);

  const handlePlayPause = (profileId: string, type: 'original' | 'cloned') => {
    const buttonId = `${profileId}-${type}`;
    const cachedUrl = audioCache[buttonId];
    
    // If this button is playing, pause it
    if (playingId === buttonId && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    // If another audio is playing, stop it
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }

    if (!cachedUrl) {
      toast.error("音频加载中，请稍候");
      return;
    }

    const audio = new Audio(cachedUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };
    
    audio.onerror = () => {
      setPlayingId(null);
      audioRef.current = null;
      toast.error("音频播放失败");
    };

    audio.play();
    setPlayingId(buttonId);
  };

  return (
    <div className="animate-fade-in">
      {/* Voice Profiles Grid */}
      <div className="flex items-start gap-6 mb-6">
        {voiceProfiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-card border border-border rounded-lg p-4 shadow-soft hover:shadow-medium transition-shadow duration-200"
          >
            {/* Avatar */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
                <img 
                  src={profile.avatar} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-medium text-foreground">
                {profile.name}
              </span>
              <span className="text-xs text-primary">{profile.gender}</span>
            </div>

            {/* Voice Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="play"
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => handlePlayPause(profile.id, 'original')}
                disabled={loadingCache[`${profile.id}-original`]}
              >
                {loadingCache[`${profile.id}-original`] ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : playingId === `${profile.id}-original` ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {profile.original}
              </Button>
              <Button
                variant="play"
                size="sm"
                className="justify-start gap-2 text-xs"
                onClick={() => handlePlayPause(profile.id, 'cloned')}
                disabled={loadingCache[`${profile.id}-cloned`]}
              >
                {loadingCache[`${profile.id}-cloned`] ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : playingId === `${profile.id}-cloned` ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {profile.cloned}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@step-tts-2</span>{" "}
        生成与原声音一模一样的语音复刻品
      </p>
    </div>
  );
};

export default VoiceCloneTab;
