import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://vixczylcdviqivlziovw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpeGN6eWxjZHZpcWl2bHppb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzQ0NzAsImV4cCI6MjA4MjE1MDQ3MH0.XKpCSVe3ctAZgjfh90W_x6mdA-lqcJRHUndy4LXROkg";

const cases = [
  {
    id: "case1",
    label: "新闻播报",
    text: "今日科技快讯：人工智能技术再获重大突破，阶跃星辰发布新一代语音合成模型，实现了前所未有的自然度和情感表达能力。",
  },
  {
    id: "case2",
    label: "有声读物",
    text: "夜幕降临，月光洒落在宁静的小镇上。远处传来阵阵虫鸣，微风轻轻拂过树梢，带来一丝凉意。这是一个适合讲故事的夜晚。",
  },
  {
    id: "case3",
    label: "客服助手",
    text: "您好，欢迎致电智能客服中心。我是您的AI助手小星，很高兴为您服务。请问有什么可以帮助您的吗？",
  },
];

const TextToSpeechTab = () => {
  const [activeCase, setActiveCase] = useState("case1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [loadingCache, setLoadingCache] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentCase = cases.find((c) => c.id === activeCase) || cases[0];

  // Preload audio sequentially to avoid rate limits
  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const loadAudioSequentially = async () => {
      for (const caseItem of cases) {
        if (cancelled) return;

        setLoadingCache((prev) => ({ ...prev, [caseItem.id]: true }));

        try {
          let retries = 3;

          while (!cancelled && retries > 0) {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/step-tts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ text: caseItem.text }),
              signal: abortController.signal,
            });

            if (response.ok) {
              const audioBlob = await response.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              setAudioCache((prev) => ({ ...prev, [caseItem.id]: audioUrl }));
              break;
            }

            if (response.status === 429) {
              retries -= 1;
              await sleep(1200);
              continue;
            }

            break;
          }
        } catch (error) {
          // Ignore aborts (React StrictMode remount, tab switch, etc.)
          if ((error as { name?: string } | null)?.name !== "AbortError") {
            console.error("Preload error:", error);
          }
        } finally {
          if (!cancelled) {
            setLoadingCache((prev) => ({ ...prev, [caseItem.id]: false }));
          }
        }

        await sleep(350);
      }
    };

    // Defer start so StrictMode's mount/unmount cycle won't create overlapping requests
    const t = window.setTimeout(() => {
      void loadAudioSequentially();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      abortController.abort();
    };
  }, []);

  const handlePlayPause = () => {
    const cachedUrl = audioCache[activeCase];
    
    // If already playing this audio, toggle pause/play
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (!cachedUrl) {
      toast.error("音频加载中，请稍候");
      return;
    }

    const audio = new Audio(cachedUrl);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    
    audio.onerror = () => {
      setIsPlaying(false);
      audioRef.current = null;
      toast.error("音频播放失败");
    };

    audio.play();
    setIsPlaying(true);
  };

  // Reset audio when switching cases
  const handleCaseChange = (caseId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setActiveCase(caseId);
  };

  const isCurrentLoading = loadingCache[activeCase];

  return (
    <div className="animate-fade-in">
      {/* Text Display Area */}
      <div className="bg-card border border-border rounded-lg p-6 mb-4 min-h-[160px] shadow-soft">
        <pre className="text-foreground font-mono text-sm whitespace-pre-wrap leading-relaxed">
          {currentCase.text}
        </pre>
      </div>

      {/* Case Selector */}
      <div className="flex items-center gap-2 mb-6">
        {cases.map((caseItem) => (
          <Button
            key={caseItem.id}
            variant={activeCase === caseItem.id ? "caseActive" : "case"}
            size="sm"
            onClick={() => handleCaseChange(caseItem.id)}
            className="min-w-[70px] transition-all duration-200"
          >
            {caseItem.label}
          </Button>
        ))}
      </div>

      {/* Description and Play */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">@Step-tts-2</span>{" "}
          生成效具有人感、拥有丰富情绪、风格的语音
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handlePlayPause}
          disabled={isCurrentLoading}
        >
          {isCurrentLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {isCurrentLoading ? "加载中..." : isPlaying ? "暂停" : "播放"}
        </Button>
      </div>
    </div>
  );
};

export default TextToSpeechTab;
