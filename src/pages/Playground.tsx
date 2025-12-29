import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageSquareText, Copy, Wand2, RefreshCw, X, BookOpen, Cpu, Headphones, Mic, GraduationCap, Sparkles, HeadphonesIcon, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VoiceCloneTab from "@/components/VoiceCloneTab";
import VoiceEditTab, { SentenceSegment } from "@/components/VoiceEditTab";
import SentenceTimeline, { SentenceTimelineHandle } from "@/components/SentenceTimeline";
import { Slider } from "@/components/ui/slider";
import AudioPlayerBar from "@/components/AudioPlayerBar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useCustomVoices } from "@/hooks/useCustomVoices";

const sidebarTabs = [
  { id: "tts", label: "文本转语音", icon: MessageSquareText },
  { id: "clone", label: "语音复刻", icon: Copy },
  { id: "edit", label: "语音编辑", icon: Wand2 },
];

const voiceOptions = [
  { value: "qingchunshaoniu", label: "清纯少女" },
  { value: "tianmeinvsheng", label: "甜美女声" },
  { value: "cixingnansheng", label: "磁性男声" },
  { value: "wenzhongnansheng", label: "稳重男声" },
];

const formatOptions = [
  { value: "mp3", label: "mp3" },
  { value: "wav", label: "wav" },
  { value: "ogg", label: "ogg" },
];

// Storage file mapping for pre-generated audio
const storageFiles: Record<number, string> = {
  1: "tts/playground-case-1.mp3",
  2: "tts/playground-case-2.mp3",
  3: "tts/playground-case-3.mp3",
  4: "tts/playground-case-4.mp3",
  5: "tts/playground-case-5.mp3",
  6: "tts/playground-case-6.mp3",
};

const caseSamples = [
  {
    id: 1,
    title: "新闻播报",
    description: "Step 3模型发布",
    audioTitle: "Step 3发布",
    icon: Cpu,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    text: "各位观众朋友们，大家好！欢迎收看今日科技快讯。今天我们要报道一则重磅消息：阶跃星辰正式发布了全新的Step 3大语言模型，该模型在多项基准测试中取得了突破性成绩，在逻辑推理、代码生成和多语言理解等核心能力上均达到了业界领先水平，标志着国产大模型迈入了新的里程碑。",
  },
  {
    id: 2,
    title: "有声读物",
    description: "悬疑故事",
    audioTitle: "午夜来信",
    icon: BookOpen,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
    text: "午夜时分，老宅的钟声敲响了十二下。李探长站在书房门前，手中的手电筒微微颤抖。书架后面传来奇怪的响动，像是有人在翻动书页。他深吸一口气，推开了那扇尘封已久的暗门。眼前的景象让他倒吸一口凉气——墙上挂满了泛黄的照片，每一张都是同一个人，而那个人，三十年前就已经失踪了。",
  },
  {
    id: 3,
    title: "客服助手",
    description: "智能客服对话",
    audioTitle: "智能客服",
    icon: Headphones,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-500/10",
    text: "您好，欢迎致电阶跃星辰客户服务中心，我是您的智能语音助理小星。很高兴为您服务！请问有什么可以帮助您的吗？您可以咨询产品功能、技术支持、账户问题或商务合作等事宜。我会尽我所能为您提供专业、高效的解答。如果需要转接人工客服，请随时告诉我。",
  },
  {
    id: 4,
    title: "广告配音",
    description: "品牌宣传片",
    audioTitle: "品牌宣传",
    icon: Mic,
    iconColor: "text-violet-500",
    bgColor: "bg-violet-500/10",
    text: "在这个瞬息万变的时代，我们始终相信科技的力量。阶跃星辰，以创新为引擎，以梦想为翼，致力于打造最前沿的人工智能技术。从语音合成到智能对话，从文本理解到多模态交互，我们用技术连接未来，让每一次交流都充满温度。阶跃星辰，与您一起，跨越星辰大海。",
  },
  {
    id: 5,
    title: "教育朗读",
    description: "古诗词赏析",
    audioTitle: "静夜思",
    icon: GraduationCap,
    iconColor: "text-sky-500",
    bgColor: "bg-sky-500/10",
    text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。这首《静夜思》是唐代诗人李白创作的一首脍炙人口的五言绝句。诗人通过描绘月夜思乡的场景，以简洁而深刻的语言，表达了游子对故乡的深切思念之情。全诗意境清幽，情感真挚，千百年来感动了无数漂泊在外的游子。",
  },
  {
    id: 6,
    title: "情感电台",
    description: "深夜治愈",
    audioTitle: "深夜治愈",
    icon: Sparkles,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-500/10",
    text: "亲爱的听众朋友，欢迎来到星辰夜话。在这个安静的夜晚，让我陪伴你度过这段温柔的时光。生活或许不总是一帆风顺，但请相信，每一个黎明都会带来新的希望。无论今天经历了什么，都请记得对自己温柔一些。闭上眼睛，深呼吸，让我的声音伴你入眠，祝你好梦。",
  },
];

const Playground = () => {
  const { customVoices, refreshVoices } = useCustomVoices();
  
  const [activeTab, setActiveTab] = useState("tts");

  const sentenceTimelineRef = useRef<SentenceTimelineHandle | null>(null);

  // Hide player bar when switching tabs
  const handleTabChange = (value: string) => {
    sentenceTimelineRef.current?.stop();
    setActiveTab(value);
    setShowPlayerBar(false);
    setShowSaveVoice(false);
    setSaveVoiceCallback(null);
    setEditSentences([]);
    setEditSelectedSentenceId(null);
    setEditPlayingSentenceId(null);
  };
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("tianmeinvsheng");
  const [speed, setSpeed] = useState([1]);
  const [volume, setVolume] = useState([1]);
  const [format, setFormat] = useState("mp3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentAudioTitle, setCurrentAudioTitle] = useState<string>("");
  const [currentVoiceDisplayName, setCurrentVoiceDisplayName] = useState<string>("");
  const [showPlayerBar, setShowPlayerBar] = useState(false);
  const [showSaveVoice, setShowSaveVoice] = useState(false);
  const [saveVoiceCallback, setSaveVoiceCallback] = useState<(() => void) | null>(null);
  const [editSentences, setEditSentences] = useState<SentenceSegment[]>([]);
  const [editSelectedSentenceId, setEditSelectedSentenceId] = useState<number | null>(null);
  const [editPlayingSentenceId, setEditPlayingSentenceId] = useState<number | null>(null);
  const [editCurrentTime, setEditCurrentTime] = useState(0);
  const [editDuration, setEditDuration] = useState(0);
  const [editIsGenerating, setEditIsGenerating] = useState(false);
  const [editGeneratingSentenceId, setEditGeneratingSentenceId] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get current voice name for display
  const getCurrentVoiceName = () => {
    const systemVoice = voiceOptions.find(v => v.value === voice);
    if (systemVoice) return systemVoice.label;
    const customVoice = customVoices.find(v => v.id === voice);
    if (customVoice) return customVoice.name;
    return "未知音色";
  };

  // Refresh custom voices when switching to TTS tab
  useEffect(() => {
    if (activeTab === "tts") {
      refreshVoices();
    }
  }, [activeTab, refreshVoices]);

  // Show player bar when audio is ready
  useEffect(() => {
    if (audioUrl) {
      setShowPlayerBar(true);
    }
  }, [audioUrl]);

  const generateAudio = async (inputText: string) => {
    if (!inputText.trim()) return;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsGenerating(true);
    setAudioUrl(null);
    
    try {
      console.log("Starting TTS generation...");

      const { data, error } = await supabase.functions.invoke("step-tts", {
        body: { text: inputText, voice },
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        console.log("TTS generation was cancelled");
        return;
      }

      // Network/relay errors still come through here
      if (error) {
        const status = (error as any)?.context?.status ?? (error as any)?.status;
        const msg = (error as any)?.message || "音频生成失败";

        if (
          status === 402 ||
          String(msg).includes("quota_exceeded") ||
          String(msg).includes(" 402")
        ) {
          toast.error("额度已用完，请更新密钥或升级套餐");
        } else {
          toast.error(msg);
        }
        return;
      }

      // The function may return JSON { error } (e.g. quota exceeded) with 200
      if (data && typeof data === "object" && "error" in (data as any)) {
        const upstreamStatus = (data as any).upstream_status;
        const message = String((data as any).error || "音频生成失败");

        if (
          upstreamStatus === 402 ||
          message.includes("quota") ||
          message.includes("quota_exceeded")
        ) {
          toast.error("额度已用完，请更新密钥或升级套餐");
        } else {
          toast.error(message);
        }
        return;
      }

      const audioBlob =
        data instanceof Blob ? data : new Blob([data as any], { type: "audio/mpeg" });
      console.log("Audio blob size:", audioBlob.size);

      if (audioBlob.size === 0) {
        throw new Error("生成的音频为空");
      }

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      console.log("Audio URL created successfully");
    } catch (error) {
      // Don't show error if it was an abort
      if (abortController.signal.aborted) {
        console.log("TTS generation was cancelled");
        return;
      }
      console.error("TTS error:", error);
      toast.error(error instanceof Error ? error.message : "音频生成失败，请重试");
    } finally {
      // Only update state if not aborted
      if (!abortController.signal.aborted) {
        setIsGenerating(false);
        console.log("TTS generation finished");
      }
    }
  };

  const handleCaseClick = (sample: typeof caseSamples[0]) => {
    setText(sample.text);
    setCurrentAudioTitle(sample.audioTitle);
    setAudioUrl(null);
  };

  const handleGenerateClick = () => {
    if (text.trim()) {
      if (!currentAudioTitle) {
        setCurrentAudioTitle("自定义音频");
      }
      // Set voice name from current TTS settings
      const voiceName = voiceOptions.find(v => v.value === voice)?.label || 
                        customVoices.find(v => v.id === voice)?.name || 
                        "未知音色";
      setCurrentVoiceDisplayName(voiceName);
      generateAudio(text);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 10000) {
      setText(value);
    }
  };

  const handleClear = () => {
    // Cancel any ongoing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setText("");
    setAudioUrl(null);
    setShowPlayerBar(false);
    setCurrentAudioTitle("");
  };

  const handleClosePlayerBar = () => {
    sentenceTimelineRef.current?.stop();
    setEditPlayingSentenceId(null);
    setShowPlayerBar(false);
    setShowSaveVoice(false);
    setSaveVoiceCallback(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">阶跃星辰</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">开放平台</span>
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                首页
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                文档中心
              </a>
              <Link to="/playground" className="flex items-center gap-1 text-sm text-primary font-medium">
                体验中心
                <ChevronDown size={14} />
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                繁星计划
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                阶跃星辰官网
              </a>
            </div>

            {/* Right: User Center */}
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              用户中心
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-56px)] border-r border-border bg-card/50 p-4 flex flex-col">
          <h2 className="text-lg font-semibold text-foreground mb-6">Playground</h2>
          
          <nav className="space-y-1 flex-1">
            {sidebarTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Contact Button */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button variant="outline" className="mt-auto gap-2 cursor-pointer">
                <HeadphonesIcon className="w-4 h-4" />
                联系我们
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-4" side="top" align="start">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground">联系方式</h4>
                
                {/* Discord */}
                <a 
                  href="https://discord.gg/lovable-dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center">
                    <svg width="18" height="14" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5765 44.3433C53.9319 44.6363 54.3041 44.9293 54.6791 45.2082C54.8078 45.304 54.7994 45.5041 54.6595 45.5858C52.8909 46.6197 51.0522 47.4931 49.1183 48.2228C48.9924 48.2707 48.9364 48.4172 48.998 48.5383C50.0624 50.6034 51.2798 52.5699 52.6221 54.435C52.6781 54.5139 52.7788 54.5477 52.8712 54.5195C58.6726 52.7249 64.5553 50.0174 70.6282 45.5576C70.6814 45.5182 70.715 45.459 70.7206 45.3942C72.2165 30.0252 68.2127 16.7119 60.1963 4.9823C60.1768 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Discord 社区</span>
                </a>

                {/* Email */}
                <a 
                  href="mailto:platform@stepfun.com"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">邮箱联系</span>
                    <span className="text-xs text-muted-foreground">platform@stepfun.com</span>
                  </div>
                </a>
              </div>
            </HoverCardContent>
          </HoverCard>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            {activeTab === "tts" && (
              <>
                {/* Text Input Area */}
                <div className="bg-accent/30 border border-border rounded-xl p-1 mb-6 relative">
                  {text.length > 0 && (
                    <button
                      onClick={handleClear}
                      className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <Textarea
                    placeholder="点此输入您想要生成音频的文本..."
                    value={text}
                    onChange={handleTextChange}
                    maxLength={10000}
                    className="min-h-[300px] bg-transparent border-0 resize-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground pb-8 pr-10"
                  />
                  <div className="absolute bottom-3 right-4 text-sm text-muted-foreground">
                    {text.length}/10000字符
                  </div>
                </div>

                {/* Generate Button - Show when text is entered but no audio yet */}
                {text.trim() && !audioUrl && !isGenerating && (
                  <div className="mb-6 flex justify-center">
                    <Button
                      onClick={handleGenerateClick}
                      className="gap-2 h-11 px-12"
                    >
                      生成音频
                    </Button>
                  </div>
                )}

                {/* Generating State */}
                {isGenerating && (
                  <div className="mb-6 flex justify-center">
                    <Button
                      disabled
                      className="gap-2 h-11 px-12"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      正在生成...
                    </Button>
                  </div>
                )}

                {/* Audio Ready State - Show regenerate button */}
                {audioUrl && !isGenerating && (
                  <div className="mb-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleGenerateClick}
                      disabled={isGenerating || !text.trim()}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重新生成
                    </Button>
                  </div>
                )}

                {/* Case Samples - Compact horizontal tags */}
                {!text.trim() && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">选择一个场景案例体验语音合成</p>
                    <div className="flex flex-wrap gap-3">
                      {caseSamples.map((sample) => {
                        const IconComponent = sample.icon;
                        return (
                          <button
                            key={sample.id}
                            onClick={() => handleCaseClick(sample)}
                            className="group flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200"
                          >
                            <div className={`w-6 h-6 rounded-md ${sample.bgColor} flex items-center justify-center shrink-0`}>
                              <IconComponent className={`w-3.5 h-3.5 ${sample.iconColor}`} />
                            </div>
                            <span className="font-medium text-sm text-foreground">{sample.title}</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-sm text-muted-foreground">{sample.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "clone" && (
              <VoiceCloneTab
                onAudioGenerated={(url, title) => {
                  setAudioUrl(url);
                  setCurrentAudioTitle(title);
                  setCurrentVoiceDisplayName("复刻音色");
                  setShowPlayerBar(true);
                  setShowSaveVoice(true);
                }}
                onSaveVoiceReady={(openDialog) => {
                  setSaveVoiceCallback(() => openDialog);
                }}
                onAudioDeleted={() => {
                  setShowPlayerBar(false);
                  setShowSaveVoice(false);
                  setSaveVoiceCallback(null);
                }}
              />
            )}
            {activeTab === "edit" && (
              <VoiceEditTab
                onAudioGenerated={(url, title) => {
                  setAudioUrl(url);
                  setCurrentAudioTitle(title);
                  setCurrentVoiceDisplayName("编辑音频");
                  setShowPlayerBar(true);
                  setEditIsGenerating(false);
                }}
                onAudioDeleted={() => {
                  setShowPlayerBar(false);
                  setEditSentences([]);
                  setEditIsGenerating(false);
                  setEditGeneratingSentenceId(null);
                }}
                onSentencesChange={setEditSentences}
                onGeneratingChange={(generating, title) => {
                  setEditIsGenerating(generating);
                  if (generating && title) {
                    setCurrentAudioTitle(title);
                    setCurrentVoiceDisplayName("编辑音频");
                    setShowPlayerBar(true);
                  }
                }}
                onEditGeneratingChange={setEditGeneratingSentenceId}
              />
            )}
          </div>
        </main>

        {/* Right Sidebar - Controls (only for TTS tab) */}
        {activeTab === "tts" && (
          <aside className="w-64 min-h-[calc(100vh-56px)] border-l border-border bg-card/50 p-6">
            <div className="space-y-6">
              {/* Voice Select */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">voice</label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">系统音色</SelectLabel>
                      {voiceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {customVoices.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground">我的音色</SelectLabel>
                        {customVoices.map((cv) => (
                          <SelectItem key={cv.id} value={cv.id}>
                            {cv.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">speed</label>
                  <span className="text-sm text-muted-foreground">{speed[0]}</span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">volume</label>
                  <span className="text-sm text-muted-foreground">{volume[0]}</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Format Select */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">format</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom padding when player bar is visible */}
      {showPlayerBar && <div className={editSentences.length > 0 ? "h-36" : "h-20"} />}

      {/* Sentence Timeline for Edit tab */}
      {activeTab === "edit" && editSentences.length > 0 && (
        <SentenceTimeline
          ref={sentenceTimelineRef}
          sentences={editSentences}
          onEditSentence={(id) => {
            (window as any).__voiceEditOpenModal?.(id);
          }}
          onEditAllSentences={() => {
            // Edit the first sentence as a starting point
            if (editSentences.length > 0) {
              (window as any).__voiceEditOpenModal?.(editSentences[0].id);
            }
          }}
          onSentencesUpdate={setEditSentences}
          onSelectionChange={setEditSelectedSentenceId}
          onPlayingChange={setEditPlayingSentenceId}
          onTimeChange={(current, total) => {
            setEditCurrentTime(current);
            setEditDuration(total);
          }}
          onDelete={() => {
            setEditSentences([]);
            handleClosePlayerBar();
          }}
          editGeneratingId={editGeneratingSentenceId}
        />
      )}

      {/* Fixed Bottom Audio Player Bar */}
      <AudioPlayerBar
        audioUrl={audioUrl}
        title={currentAudioTitle}
        voiceName={currentVoiceDisplayName || getCurrentVoiceName()}
        isVisible={showPlayerBar}
        onClose={handleClosePlayerBar}
        showSaveVoice={showSaveVoice && activeTab === "clone"}
        onSaveVoice={saveVoiceCallback || undefined}
        hideProgressBar={activeTab === "edit"}
        hideSkipControls={activeTab === "edit"}
        onTogglePlay={
          activeTab === "edit" && !editIsGenerating
            ? () => sentenceTimelineRef.current?.togglePlayFrom(editSelectedSentenceId)
            : undefined
        }
        isPlayingOverride={
          activeTab === "edit" ? editPlayingSentenceId !== null : undefined
        }
        durationOverride={activeTab === "edit" ? editDuration : undefined}
        currentTimeOverride={activeTab === "edit" ? editCurrentTime : undefined}
        isGenerating={activeTab === "edit" && editIsGenerating}
      />
    </div>
  );
};

export default Playground;
