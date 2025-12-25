import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
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
    originalText: "大家好，我是Cila，很高兴认识你。今天天气真不错，希望你有愉快的一天！",
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
    originalText: "你好，我是John，欢迎来到我们的语音平台。让我为你展示一下语音合成的魅力。",
    clonedText: "你好，这是通过Step-tts-2模型复刻我的声音生成的语音，听起来和原声一样自然。",
    voice: "cixingnansheng",
  },
];

const VoiceCloneTab = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // Silent background preload
  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const fetchAudio = async (text: string, voice: string, signal?: AbortSignal): Promise<string | null> => {
      let retries = 5;
      let delay = 2000;

      while (retries > 0) {
        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/step-tts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ text, voice }),
            signal,
          });

          if (response.ok) {
            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
          }

          if (response.status === 429) {
            retries -= 1;
            await sleep(delay);
            delay = Math.min(delay * 1.5, 10000);
            continue;
          }
          break;
        } catch (error) {
          if ((error as { name?: string } | null)?.name === "AbortError") return null;
          retries -= 1;
          await sleep(delay);
        }
      }
      return null;
    };

    const loadAllAudio = async () => {
      const items: Array<{ key: string; text: string; voice: string }> = [];

      for (const profile of voiceProfiles) {
        items.push({ key: `${profile.id}-original`, text: profile.originalText, voice: profile.voice });
        items.push({ key: `${profile.id}-cloned`, text: profile.clonedText, voice: profile.voice });
      }

      for (const item of items) {
        if (cancelled) return;
        const audioUrl = await fetchAudio(item.text, item.voice, abortController.signal);
        if (cancelled) return;
        if (audioUrl) {
          setAudioCache((prev) => ({ ...prev, [item.key]: audioUrl }));
        }
        await sleep(1000);
      }
    };

    void loadAllAudio();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, []);

  const handlePlayPause = (profileId: string, type: "original" | "cloned") => {
    const buttonId = `${profileId}-${type}`;

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

    const audioUrl = audioCache[buttonId];

    if (!audioUrl) {
      toast.info("音频加载中，请稍候...");
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
      toast.error("音频播放失败");
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
