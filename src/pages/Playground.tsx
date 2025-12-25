import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageSquareText, Copy, Wand2, Phone } from "lucide-react";
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
  "欢迎使用阶跃星辰语音合成系统",
  "今天天气真好，适合出去散步",
  "人工智能正在改变我们的生活",
  "科技让生活更美好",
  "语音合成技术日趋成熟",
  "感谢您的使用和支持",
];

const Playground = () => {
  const [activeTab, setActiveTab] = useState("tts");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("qingchunshaoniu");
  const [speed, setSpeed] = useState([1]);
  const [volume, setVolume] = useState([1]);
  const [format, setFormat] = useState("mp3");

  const handleCaseClick = (sample: string) => {
    setText(sample);
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
            <div className="bg-accent/30 border border-border rounded-xl p-1 mb-6">
              <Textarea
                placeholder="点此输入您想要生成音频的文本..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] bg-transparent border-0 resize-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Case Samples */}
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
            <Button className="w-full mt-4">
              生成音频
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Playground;
