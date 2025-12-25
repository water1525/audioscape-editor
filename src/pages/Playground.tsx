import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageSquareText, Copy, Wand2, Phone, Play, Pause, RotateCcw, Download, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  "欢迎来到阶跃星辰开放平台，我是您的智能语音助手。今天我将为您展示最先进的语音合成技术，让您体验自然流畅的人工智能语音。",
  "各位听众朋友们，大家好！今天的天气预报显示，北京地区晴转多云，最高气温28度，最低气温18度，空气质量优良，适宜户外活动。",
  "从前有一座高山，山上住着一位老爷爷。他每天都会给村里的孩子们讲故事，那些故事里有勇敢的少年、神奇的宝物，还有善良的小动物们。",
  "人工智能技术正在深刻改变我们的生活方式。从智能家居到自动驾驶，从语音助手到医疗诊断，AI的应用场景越来越广泛。",
  "您好，感谢致电客户服务中心。您的满意是我们最大的追求，如需帮助请按1，查询订单请按2，人工服务请按0。",
  "亲爱的用户，您的快递已经到达，请凭取件码到智能柜取件。祝您生活愉快，期待您的下次使用！",
];

const Playground = () => {
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

            {/* Audio Player */}
            {(audioUrl || isGenerating) && (
              <div className="mb-6">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateClick}
                    disabled={isGenerating || !text.trim()}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    重新生成
                  </Button>
                </div>
                
                <div className="bg-primary/10 rounded-xl p-4">
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlayPause}
                      disabled={!audioUrl}
                      className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        disabled={!audioUrl}
                        className="w-full h-2 bg-primary/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                      />
                    </div>
                    
                    <span className="text-sm text-muted-foreground min-w-[100px]">
                      {formatTime(currentTime)}/{formatTime(duration)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => skipTime(-5)}
                        disabled={!audioUrl}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => skipTime(5)}
                        disabled={!audioUrl}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-5 h-5 scale-x-[-1]" />
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={!audioUrl}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Case Samples - Hide when generating or has audio */}
            {!audioUrl && !isGenerating && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">可以使用以下case</p>
                <div className="grid grid-cols-3 gap-3">
                  {caseSamples.map((sample, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className={`h-auto py-3 px-4 text-sm font-normal justify-start ${
                        text === sample ? "bg-primary/10 border-primary text-primary" : ""
                      }`}
                      onClick={() => handleCaseClick(sample)}
                    >
                      case{i + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Controls */}
        <aside className="w-64 min-h-[calc(100vh-56px)] border-l border-border bg-card/50 p-6">
          <div className="space-y-6">
            {/* Voice Select */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">voice</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
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

            {/* Generate Button */}
            <Button 
              className="w-full mt-4" 
              onClick={handleGenerateClick}
              disabled={isGenerating || !text.trim()}
            >
              {isGenerating ? "生成中..." : "生成音频"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Playground;
