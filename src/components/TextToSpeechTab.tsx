import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const dialogueLines = [
  { speaker: "客服小美", text: "您好，欢迎致电智能客服中心，请问有什么可以帮您？", file: "tts/dialogue-0.mp3" },
  { speaker: "客户先生", text: "你好，我昨天下的订单显示已发货，但物流信息一直没更新。", file: "tts/dialogue-1.mp3" },
  { speaker: "客服小美", text: "好的，请您提供一下订单号，我帮您查询。", file: "tts/dialogue-2.mp3" },
  { speaker: "客户先生", text: "订单号是202412250001。", file: "tts/dialogue-3.mp3" },
  { speaker: "客服小美", text: "已查到，您的包裹目前在转运中，预计明天送达，请您耐心等待。", file: "tts/dialogue-4.mp3" },
  { speaker: "客户先生", text: "好的，谢谢！", file: "tts/dialogue-5.mp3" },
];

const cases = [
  {
    id: "case1",
    label: "新闻播报",
    description: "Step 3模型发布",
    icon: "📰",
    gradient: "from-blue-400 to-cyan-400",
    file: "tts/case1.mp3",
    text: "阶跃星辰近日正式发布新一代基础大模型Step 3，兼顾智能与效率，面向推理时代打造最适合应用的模型。Step 3将面向全球企业和开发者开源，为开源世界贡献最强多模态推理模型。",
    isDialogue: false,
  },
  {
    id: "case2",
    label: "有声读物",
    description: "悬疑故事",
    icon: "📖",
    gradient: "from-purple-400 to-pink-400",
    file: "tts/case2.mp3",
    text: "深夜，老宅的钟敲响十二下。她推开尘封的阁楼门，发现一封泛黄的信——收件人竟是自己的名字，落款日期却是明天。信上只有一句话：不要回头。她的心跳骤然加速，身后传来轻微的脚步声。她屏住呼吸，缓缓转身，却只看见空荡荡的走廊和一面落满灰尘的镜子。镜中的自己正微笑着，但她此刻分明没有笑。",
    isDialogue: false,
  },
  {
    id: "case3",
    label: "客服助手",
    description: "智能客服对话",
    icon: "🎧",
    gradient: "from-green-400 to-emerald-400",
    file: null,
    text: dialogueLines.map(line => `${line.speaker}：${line.text}`).join("\n"),
    isDialogue: true,
  },
];

const TextToSpeechTab = () => {
  const [activeCase, setActiveCase] = useState("case1");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [dialogueUrls, setDialogueUrls] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dialogueIndexRef = useRef(0);
  const currentCase = cases.find((c) => c.id === activeCase) || cases[0];

  // Check if audio files exist in storage
  const checkAudioFiles = async () => {
    const urls: Record<string, string> = {};
    const dialogues: string[] = [];

    // Check case1 and case2
    for (const caseItem of cases.filter(c => !c.isDialogue)) {
      if (!caseItem.file) continue;
      const { data } = supabase.storage.from("audio").getPublicUrl(caseItem.file);
      try {
        const response = await fetch(data.publicUrl, { method: "HEAD" });
        if (response.ok) {
          urls[caseItem.id] = data.publicUrl;
        }
      } catch {
        // File doesn't exist
      }
    }

    // Check dialogue files
    for (const line of dialogueLines) {
      const { data } = supabase.storage.from("audio").getPublicUrl(line.file);
      try {
        const response = await fetch(data.publicUrl, { method: "HEAD" });
        if (response.ok) {
          dialogues.push(data.publicUrl);
        } else {
          dialogues.push("");
        }
      } catch {
        dialogues.push("");
      }
    }

    setAudioUrls(urls);
    setDialogueUrls(dialogues);
  };

  useEffect(() => {
    checkAudioFiles();
  }, []);

  const playDialogue = () => {
    if (dialogueUrls.length === 0 || dialogueUrls.some(u => !u)) {
      toast.error("对话音频未就绪");
      return;
    }

    dialogueIndexRef.current = 0;
    setIsPlaying(true);

    const playNext = () => {
      if (dialogueIndexRef.current >= dialogueUrls.length) {
        setIsPlaying(false);
        audioRef.current = null;
        return;
      }

      const audio = new Audio(dialogueUrls[dialogueIndexRef.current]);
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
      playDialogue();
      return;
    }

    const cachedUrl = audioUrls[activeCase];
    if (!cachedUrl) {
      toast.error("音频未就绪");
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

  const handleCaseChange = (caseId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    dialogueIndexRef.current = 0;
    setActiveCase(caseId);
  };

  const isCurrentReady = currentCase.isDialogue
    ? dialogueUrls.length > 0 && dialogueUrls.every(u => u !== "")
    : !!audioUrls[activeCase];

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
          disabled={!isCurrentReady}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "暂停" : "播放"}
        </Button>
      </div>
    </div>
  );
};

export default TextToSpeechTab;
