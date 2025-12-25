import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://vixczylcdviqivlziovw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpeGN6eWxjZHZpcWl2bHppb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzQ0NzAsImV4cCI6MjA4MjE1MDQ3MH0.XKpCSVe3ctAZgjfh90W_x6mdA-lqcJRHUndy4LXROkg";

// Dialogue lines for case3 with different voices
const dialogueLines = [
  { speaker: "客服小美", text: "您好，欢迎致电智能客服中心，请问有什么可以帮您？", voice: "tianmeinvsheng" },
  { speaker: "客户先生", text: "你好，我昨天下的订单显示已发货，但物流信息一直没更新。", voice: "cixingnansheng" },
  { speaker: "客服小美", text: "好的，请您提供一下订单号，我帮您查询。", voice: "tianmeinvsheng" },
  { speaker: "客户先生", text: "订单号是202412250001。", voice: "cixingnansheng" },
  { speaker: "客服小美", text: "已查到，您的包裹目前在转运中，预计明天送达，请您耐心等待。", voice: "tianmeinvsheng" },
  { speaker: "客户先生", text: "好的，谢谢！", voice: "cixingnansheng" },
];

const cases = [
  {
    id: "case1",
    label: "新闻播报",
    description: "Step 3模型发布",
    icon: "📰",
    gradient: "from-blue-400 to-cyan-400",
    voice: "cixingnansheng",
    text: "阶跃星辰近日正式发布新一代基础大模型Step 3，兼顾智能与效率，面向推理时代打造最适合应用的模型。Step 3将面向全球企业和开发者开源，为开源世界贡献最强多模态推理模型。",
    isDialogue: false,
  },
  {
    id: "case2",
    label: "有声读物",
    description: "悬疑故事",
    icon: "📖",
    gradient: "from-purple-400 to-pink-400",
    voice: "tianmeinvsheng",
    text: "深夜，老宅的钟敲响十二下。她推开尘封的阁楼门，发现一封泛黄的信——收件人竟是自己的名字，落款日期却是明天。信上只有一句话：不要回头。她的心跳骤然加速，身后传来轻微的脚步声。她屏住呼吸，缓缓转身，却只看见空荡荡的走廊和一面落满灰尘的镜子。镜中的自己正微笑着，但她此刻分明没有笑。",
    isDialogue: false,
  },
  {
    id: "case3",
    label: "客服助手",
    description: "智能客服对话",
    icon: "🎧",
    gradient: "from-green-400 to-emerald-400",
    voice: "tianmeinvsheng",
    text: dialogueLines.map(line => `${line.speaker}：${line.text}`).join("\n"),
    isDialogue: true,
  },
];

const TextToSpeechTab = () => {
  const [activeCase, setActiveCase] = useState("case1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [dialogueAudioCache, setDialogueAudioCache] = useState<string[]>([]);
  const [loadingCache, setLoadingCache] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dialogueIndexRef = useRef(0);
  const currentCase = cases.find((c) => c.id === activeCase) || cases[0];

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // Fetch audio for a single text/voice with better retry logic
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
          console.log(`Rate limited, waiting ${delay}ms before retry...`);
          retries -= 1;
          await sleep(delay);
          delay = Math.min(delay * 1.5, 10000); // Exponential backoff, max 10s
          continue;
        }
        
        console.error("TTS API error:", response.status);
        break;
      } catch (error) {
        if ((error as { name?: string } | null)?.name === "AbortError") {
          return null;
        }
        console.error("Fetch audio error:", error);
        retries -= 1;
        await sleep(delay);
      }
    }
    return null;
  };

  // Preload audio sequentially to avoid rate limits (6 RPM, 1 concurrent)
  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const loadAudioSequentially = async () => {
      console.log("Starting audio preload (strict rate limiting: 1 request per 12s)...");
      
      // Collect all items to load
      const allItems: Array<{ id: string; text: string; voice: string; isDialogueLine: boolean; lineIndex?: number }> = [];
      
      // Add case1 and case2
      for (const caseItem of cases.filter(c => !c.isDialogue)) {
        allItems.push({ id: caseItem.id, text: caseItem.text, voice: caseItem.voice, isDialogueLine: false });
      }
      
      // Add dialogue lines for case3
      dialogueLines.forEach((line, index) => {
        allItems.push({ id: `dialogue_${index}`, text: line.text, voice: line.voice, isDialogueLine: true, lineIndex: index });
      });

      const dialogueAudios: string[] = new Array(dialogueLines.length).fill("");
      
      // Set all as loading initially
      setLoadingCache({ case1: true, case2: true, case3: true });

      for (let i = 0; i < allItems.length; i++) {
        if (cancelled) return;
        
        const item = allItems[i];
        console.log(`Loading item ${i + 1}/${allItems.length}: ${item.id}`);

        const audioUrl = await fetchAudio(item.text, item.voice, abortController.signal);
        
        if (cancelled) return;

        if (audioUrl) {
          if (item.isDialogueLine && item.lineIndex !== undefined) {
            dialogueAudios[item.lineIndex] = audioUrl;
          } else {
            setAudioCache((prev) => ({ ...prev, [item.id]: audioUrl }));
            setLoadingCache((prev) => ({ ...prev, [item.id]: false }));
          }
          console.log(`✓ ${item.id} loaded successfully`);
        } else {
          console.error(`✗ Failed to load ${item.id}`);
        }

        // Wait 12 seconds between requests to stay under 6 RPM (5 requests per minute max)
        if (i < allItems.length - 1) {
          console.log(`Waiting 12s before next request...`);
          await sleep(12000);
        }
      }

      // Set dialogue cache once all are loaded
      if (!cancelled) {
        const validDialogues = dialogueAudios.filter(url => url !== "");
        if (validDialogues.length > 0) {
          setDialogueAudioCache(dialogueAudios);
          console.log(`Dialogue loaded: ${validDialogues.length}/${dialogueLines.length} lines`);
        }
        setLoadingCache((prev) => ({ ...prev, case3: false }));
      }
    };

    const t = window.setTimeout(() => {
      void loadAudioSequentially();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      abortController.abort();
    };
  }, []);

  // Play dialogue lines sequentially
  const playDialogue = () => {
    if (dialogueAudioCache.length === 0) {
      toast.error("音频加载中，请稍候");
      return;
    }

    dialogueIndexRef.current = 0;
    setIsPlaying(true);

    const playNext = () => {
      if (dialogueIndexRef.current >= dialogueAudioCache.length) {
        setIsPlaying(false);
        audioRef.current = null;
        return;
      }

      const audio = new Audio(dialogueAudioCache[dialogueIndexRef.current]);
      audioRef.current = audio;

      audio.onended = () => {
        dialogueIndexRef.current += 1;
        playNext();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
        toast.error("音频播放失败");
      };

      audio.play();
    };

    playNext();
  };

  const handlePlayPause = () => {
    // If already playing, toggle pause/play
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

    // Handle dialogue case specially
    if (currentCase.isDialogue) {
      playDialogue();
      return;
    }

    // Handle single voice cases
    const cachedUrl = audioCache[activeCase];
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
    dialogueIndexRef.current = 0;
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
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {cases.map((caseItem) => (
          <button
            key={caseItem.id}
            onClick={() => handleCaseChange(caseItem.id)}
            className={`
              flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all duration-200
              ${activeCase === caseItem.id 
                ? 'bg-primary/10 border-primary/50 shadow-md shadow-primary/10' 
                : 'bg-card/50 border-border/50 hover:bg-card hover:border-border'
              }
            `}
          >
            <span className={`
              w-6 h-6 rounded-full bg-gradient-to-br ${caseItem.gradient} 
              flex items-center justify-center text-xs shadow-sm
            `}>
              {caseItem.icon}
            </span>
            <span className="text-sm font-medium text-foreground">{caseItem.label}</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-sm text-muted-foreground">{caseItem.description}</span>
          </button>
        ))}
      </div>

      {/* Description and Play */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">@Step-tts-2</span>{" "}
          生成效具有人感、拥有丰富情绪、风格的语音
        </p>
        <Button 
          className="gap-2.5 px-6 py-2.5 h-auto text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          onClick={handlePlayPause}
          disabled={isCurrentLoading}
        >
          {isCurrentLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isCurrentLoading ? "加载中..." : isPlaying ? "暂停" : "播放"}
        </Button>
      </div>
    </div>
  );
};

export default TextToSpeechTab;
