import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAudio } from "@/hooks/useGlobalAudio";
import WaveformAnimation from "@/components/ui/WaveformAnimation";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Voice configurations for each case
const voiceConfigs: Record<string, { voice: string; text: string }> = {
  case1: {
    voice: "cixingnansheng",
    text: "阶跃星辰近日正式发布新一代基础大模型Step 3，兼顾智能与效率，面向推理时代打造最适合应用的模型。Step 3将面向全球企业和开发者开源，为开源世界贡献最强多模态推理模型。",
  },
  case2: {
    voice: "tianmeinvsheng", 
    text: "深夜，老宅的钟敲响十二下。她推开尘封的阁楼门，发现一封泛黄的信——收件人竟是自己的名字，落款日期却是明天。信上只有一句话：不要回头。她的心跳骤然加速，身后传来轻微的脚步声。她屏住呼吸，缓缓转身，却只看见空荡荡的走廊和一面落满灰尘的镜子。镜中的自己正微笑着，但她此刻分明没有笑。",
  },
};

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
    text: voiceConfigs.case1.text,
    isDialogue: false,
  },
  {
    id: "case2",
    label: "有声读物",
    description: "悬疑故事",
    icon: "📖",
    gradient: "from-purple-400 to-pink-400",
    text: voiceConfigs.case2.text,
    isDialogue: false,
  },
  {
    id: "case3",
    label: "客服助手",
    description: "智能客服对话",
    icon: "🎧",
    gradient: "from-green-400 to-emerald-400",
    text: dialogueLines.map(line => `${line.speaker}：${line.text}`).join("\n"),
    isDialogue: true,
  },
];

// Storage file paths for pre-generated audio
const storageFiles: Record<string, string> = {
  case1: "tts/case1.mp3",
  case2: "tts/case2.mp3",
  "dialogue-0": "tts/dialogue-0.mp3",
  "dialogue-1": "tts/dialogue-1.mp3",
  "dialogue-2": "tts/dialogue-2.mp3",
  "dialogue-3": "tts/dialogue-3.mp3",
  "dialogue-4": "tts/dialogue-4.mp3",
  "dialogue-5": "tts/dialogue-5.mp3",
};

const TextToSpeechTab = () => {
  const [activeCase, setActiveCase] = useState("case1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cachedAudioUrls, setCachedAudioUrls] = useState<Record<string, string>>({});
  const [storageUrls, setStorageUrls] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dialogueIndexRef = useRef(0);
  const currentCase = cases.find((c) => c.id === activeCase) || cases[0];
  const { playAudio, stopGlobalAudio } = useGlobalAudio();

  // Check storage for pre-generated audio on mount
  useEffect(() => {
    const checkStorageFiles = async () => {
      const urls: Record<string, string> = {};
      
      for (const [caseId, filePath] of Object.entries(storageFiles)) {
        const { data } = supabase.storage.from("audio").getPublicUrl(filePath);
        try {
          // Quick check if file exists with valid content
          const response = await fetch(data.publicUrl, { 
            method: "HEAD",
          });
          if (response.ok) {
            urls[caseId] = data.publicUrl;
          }
        } catch {
          // File doesn't exist
        }
      }
      
      setStorageUrls(urls);
    };
    
    checkStorageFiles();
  }, []);

  // Generate single audio on demand
  const generateSingleAudio = async (text: string, voice: string): Promise<string | null> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/step-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error("Error generating audio:", error);
      return null;
    }
  };

  // Play single case audio
  const playSingleAudio = async () => {
    const config = voiceConfigs[activeCase];
    if (!config) return;

    // Priority: 1. Memory cache, 2. Storage, 3. Generate
    let audioUrl = cachedAudioUrls[activeCase] || storageUrls[activeCase];
    
    if (!audioUrl) {
      setIsGenerating(true);
      toast.info("正在生成音频...");
      audioUrl = await generateSingleAudio(config.text, config.voice);
      setIsGenerating(false);
      
      if (!audioUrl) {
        toast.error("音频生成失败");
        return;
      }
      
      // Cache the URL
      setCachedAudioUrls(prev => ({ ...prev, [activeCase]: audioUrl! }));
    }

    const audio = new Audio(audioUrl);
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
      toast.error("音频播放失败");
    };

    audio.play();
    setIsPlaying(true);
  };

  // Play dialogue sequentially
  const playDialogue = async () => {
    dialogueIndexRef.current = 0;
    setIsPlaying(true);
    setIsGenerating(true);
    toast.info("正在生成对话音频...");

    const playNext = async () => {
      if (dialogueIndexRef.current >= dialogueLines.length) {
        setIsPlaying(false);
        audioRef.current = null;
        return;
      }

      const line = dialogueLines[dialogueIndexRef.current];
      const cacheKey = `dialogue-${dialogueIndexRef.current}`;
      
      // Priority: 1. Memory cache, 2. Storage, 3. Generate
      let audioUrl = cachedAudioUrls[cacheKey] || storageUrls[cacheKey];
      if (!audioUrl) {
        audioUrl = await generateSingleAudio(line.text, line.voice);
        if (!audioUrl) {
          toast.error("对话音频生成失败");
          setIsPlaying(false);
          setIsGenerating(false);
          return;
        }
        setCachedAudioUrls(prev => ({ ...prev, [cacheKey]: audioUrl! }));
      }
      
      setIsGenerating(false);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      playAudio(audio, () => {
        setIsPlaying(false);
        audioRef.current = null;
      });

      audio.onended = async () => {
        dialogueIndexRef.current += 1;
        if (dialogueIndexRef.current < dialogueLines.length) {
          setIsGenerating(true);
        }
        await playNext();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
        toast.error("音频播放失败");
      };

      audio.play();
    };

    await playNext();
  };

  const handlePlayPause = async () => {
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

    if (currentCase.isDialogue) {
      await playDialogue();
      return;
    }

    await playSingleAudio();
  };

  const handleCaseChange = (caseId: string) => {
    stopGlobalAudio();
    audioRef.current = null;
    setIsPlaying(false);
    dialogueIndexRef.current = 0;
    setActiveCase(caseId);
  };

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
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <WaveformAnimation isPlaying={true} variant="small" barCount={4} className="text-primary-foreground [&>div]:bg-primary-foreground" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isGenerating ? "生成中..." : isPlaying ? "播放中" : "播放"}
        </Button>
      </div>
    </div>
  );
};

export default TextToSpeechTab;
