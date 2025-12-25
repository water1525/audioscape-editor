import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageSquareText, Copy, Wand2, Phone, Play, Pause, RotateCcw, Download, RefreshCw, X, BookOpen, Cpu, Headphones, Mic, GraduationCap, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VoiceCloneTab from "@/components/VoiceCloneTab";
import VoiceEditTab from "@/components/VoiceEditTab";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const caseSamples = [
  {
    id: 1,
    title: "新闻播报",
    description: "Step 3模型发布",
    icon: Cpu,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    text: "各位观众朋友们，大家好！欢迎收看今日科技快讯。今天我们要报道一则重磅消息：阶跃星辰正式发布了全新的Step 3大语言模型，该模型在多项基准测试中取得了突破性成绩，在逻辑推理、代码生成和多语言理解等核心能力上均达到了业界领先水平，标志着国产大模型迈入了新的里程碑。",
  },
  {
    id: 2,
    title: "有声读物",
    description: "悬疑故事",
    icon: BookOpen,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
    text: "午夜时分，老宅的钟声敲响了十二下。李探长站在书房门前，手中的手电筒微微颤抖。书架后面传来奇怪的响动，像是有人在翻动书页。他深吸一口气，推开了那扇尘封已久的暗门。眼前的景象让他倒吸一口凉气——墙上挂满了泛黄的照片，每一张都是同一个人，而那个人，三十年前就已经失踪了。",
  },
  {
    id: 3,
    title: "客服助手",
    description: "智能客服对话",
    icon: Headphones,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-500/10",
    text: "您好，欢迎致电阶跃星辰客户服务中心，我是您的智能语音助理小星。很高兴为您服务！请问有什么可以帮助您的吗？您可以咨询产品功能、技术支持、账户问题或商务合作等事宜。我会尽我所能为您提供专业、高效的解答。如果需要转接人工客服，请随时告诉我。",
  },
  {
    id: 4,
    title: "广告配音",
    description: "品牌宣传片",
    icon: Mic,
    iconColor: "text-violet-500",
    bgColor: "bg-violet-500/10",
    text: "在这个瞬息万变的时代，我们始终相信科技的力量。阶跃星辰，以创新为引擎，以梦想为翼，致力于打造最前沿的人工智能技术。从语音合成到智能对话，从文本理解到多模态交互，我们用技术连接未来，让每一次交流都充满温度。阶跃星辰，与您一起，跨越星辰大海。",
  },
  {
    id: 5,
    title: "教育朗读",
    description: "古诗词赏析",
    icon: GraduationCap,
    iconColor: "text-sky-500",
    bgColor: "bg-sky-500/10",
    text: "床前明月光，疑是地上霜。举头望明月，低头思故乡。这首《静夜思》是唐代诗人李白创作的一首脍炙人口的五言绝句。诗人通过描绘月夜思乡的场景，以简洁而深刻的语言，表达了游子对故乡的深切思念之情。全诗意境清幽，情感真挚，千百年来感动了无数漂泊在外的游子。",
  },
  {
    id: 6,
    title: "情感电台",
    description: "深夜治愈",
    icon: Sparkles,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-500/10",
    text: "亲爱的听众朋友，欢迎来到星辰夜话。在这个安静的夜晚，让我陪伴你度过这段温柔的时光。生活或许不总是一帆风顺，但请相信，每一个黎明都会带来新的希望。无论今天经历了什么，都请记得对自己温柔一些。闭上眼睛，深呼吸，让我的声音伴你入眠，祝你好梦。",
  },
];

const Playground = () => {
  const { customVoices, refreshVoices } = useCustomVoices();
  
  const [activeTab, setActiveTab] = useState("tts");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("tianmeinvsheng");
  const [speed, setSpeed] = useState([1]);
  const [volume, setVolume] = useState([1]);
  const [format, setFormat] = useState("mp3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(20).fill(20));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refresh custom voices when switching to TTS tab
  useEffect(() => {
    if (activeTab === "tts") {
      refreshVoices();
    }
  }, [activeTab, refreshVoices]);

  // Animate waveform when playing
  useEffect(() => {
    if (!isPlaying) {
      setWaveformHeights(Array(20).fill(20));
      return;
    }
    
    const interval = setInterval(() => {
      setWaveformHeights(prev => prev.map(() => Math.random() * 80 + 20));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const generateAudio = async (inputText: string) => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    setAudioUrl(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/step-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: inputText, voice }),
        }
      );

      if (!response.ok) {
        throw new Error("生成音频失败");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error("TTS error:", error);
      toast.error("音频生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCaseClick = async (sample: string) => {
    setText(sample);
    await generateAudio(sample);
  };

  const handleGenerateClick = () => {
    if (text.trim()) {
      generateAudio(text);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration));
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `audio.${format}`;
      a.click();
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 10000) {
      setText(value);
    }
  };

  const handleClear = () => {
    setText("");
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
    }
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
                  onClick={() => setActiveTab(tab.id)}
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
          <Button variant="outline" className="mt-auto gap-2">
            <Phone className="w-4 h-4" />
            联系我们
          </Button>
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

                {/* Audio Player - Only show when audio is ready */}
                {audioUrl && !isGenerating && (
                  <div className="mb-6">
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateClick}
                        disabled={isGenerating || !text.trim()}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        重新生成
                      </Button>
                    </div>
                    
                    <div className="bg-primary/10 rounded-xl p-4">
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                      />
                      
                      <div className="flex items-center gap-4">
                        <button
                          onClick={togglePlayPause}
                          className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        
                        {/* Waveform Animation */}
                        <div className="flex items-center gap-[3px] h-8">
                          {waveformHeights.map((height, i) => (
                            <div
                              key={i}
                              className="w-[3px] rounded-full bg-primary transition-all duration-100"
                              style={{
                                height: `${height}%`,
                                opacity: isPlaying ? 0.8 : 0.4,
                              }}
                            />
                          ))}
                        </div>
                        
                        <div className="flex-1">
                          <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-2 bg-primary/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                          />
                        </div>
                        
                        <span className="text-sm text-muted-foreground min-w-[100px]">
                          {formatTime(currentTime)}/{formatTime(duration)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => skipTime(-5)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => skipTime(5)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <RotateCcw className="w-5 h-5 scale-x-[-1]" />
                          </button>
                          <button
                            onClick={handleDownload}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
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
                            onClick={() => handleCaseClick(sample.text)}
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

            {activeTab === "clone" && <VoiceCloneTab />}
            {activeTab === "edit" && <VoiceEditTab />}
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
    </div>
  );
};

export default Playground;
