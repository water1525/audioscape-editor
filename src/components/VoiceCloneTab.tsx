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
    // 原声使用预下载的音频文件
    originalAudioUrl: "/audio/cila-original.mp3",
    // 声音复刻使用不同的文本
    clonedText: "欢迎使用阶跃星辰语音合成平台，我是Cila，这是通过AI技术复刻我声音生成的语音。",
    voice: "tianmeinvsheng",
  },
  {
    id: "john",
    name: "John",
    gender: "♂",
    avatar: avatarMale,
    original: "John 原声",
    cloned: "John 声音复刻",
    // 原声使用预下载的音频文件
    originalAudioUrl: "/audio/john-original.mp3",
    // 声音复刻使用不同的文本
    clonedText: "你好，这是通过Step-tts-2模型复刻我的声音生成的语音，听起来和原声一样自然。",
    voice: "cixingnansheng",
  },
];

const VoiceCloneTab = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [loadingCache, setLoadingCache] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // Preload cloned audio via API (original audio uses static files)
  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const loadClonedAudio = async () => {
      for (const profile of voiceProfiles) {
        if (cancelled) return;

        const cacheKey = `${profile.id}-cloned`;
        setLoadingCache((prev) => ({ ...prev, [cacheKey]: true }));

        try {
          let retries = 5;
          let delay = 2000;

          while (!cancelled && retries > 0) {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/step-tts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                text: profile.clonedText,
                voice: profile.voice,
              }),
              signal: abortController.signal,
            });

            if (response.ok) {
              const audioBlob = await response.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              setAudioCache((prev) => ({ ...prev, [cacheKey]: audioUrl }));
              console.log(`✓ ${cacheKey} loaded successfully`);
              break;
            }

            if (response.status === 429) {
              console.log(`Rate limited for ${cacheKey}, retrying in ${delay}ms...`);
              retries -= 1;
              await sleep(delay);
              delay = Math.min(delay * 1.5, 10000);
              continue;
            }

            console.error(`Failed to load ${cacheKey}:`, response.status);
            break;
          }
        } catch (error) {
          if ((error as { name?: string } | null)?.name !== "AbortError") {
            console.error("Preload error:", error);
          }
        } finally {
          if (!cancelled) {
            setLoadingCache((prev) => ({ ...prev, [cacheKey]: false }));
          }
        }

        // Wait between requests
        await sleep(1500);
      }
    };

    const t = window.setTimeout(() => {
      void loadClonedAudio();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      abortController.abort();
    };
  }, []);

  const handlePlayPause = (profileId: string, type: 'original' | 'cloned') => {
    const buttonId = `${profileId}-${type}`;
    const profile = voiceProfiles.find(p => p.id === profileId);
    
    if (!profile) return;
    
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

    // Get audio URL based on type
    let audioUrl: string | undefined;
    if (type === 'original') {
      // Use static file for original
      audioUrl = profile.originalAudioUrl;
    } else {
      // Use cached API response for cloned
      audioUrl = audioCache[buttonId];
    }

    if (!audioUrl) {
      toast.error("音频加载中，请稍候");
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };
    
    audio.onerror = () => {
      setPlayingId(null);
      audioRef.current = null;
      toast.error("音频播放失败，请检查音频文件是否存在");
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
              >
                {playingId === `${profile.id}-original` ? (
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
        <span className="text-foreground font-medium">@Step-tts-2</span>{" "}
        生成与原声音一模一样的语音复刻品
      </p>
    </div>
  );
};

export default VoiceCloneTab;
