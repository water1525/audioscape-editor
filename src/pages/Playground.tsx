import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageSquareText, Copy, Wand2, RefreshCw, X, Mic, GraduationCap, Sparkles, HeadphonesIcon, Mail } from "lucide-react";
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

// Custom News Icon component (matching homepage)
const NewsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M895.582235 290.577005c-0.002047-0.040932-0.007163-0.080841-0.00921-0.121773-0.033769-0.627287-0.092098-1.251503-0.164752-1.87265-0.019443-0.165776-0.039909-0.331551-0.061398-0.49835-0.085958-0.649799-0.186242-1.297552-0.313132-1.938142-0.001023-0.007163-0.002047-0.013303-0.00307-0.020466-0.12996-0.652869-0.288572-1.299599-0.459464-1.941212-0.041956-0.156566-0.085958-0.312108-0.12996-0.468674-0.169869-0.596588-0.353041-1.190105-0.558725-1.774413-0.016373-0.046049-0.029676-0.092098-0.046049-0.138146-0.220011-0.61603-0.465604-1.222851-0.724501-1.823532-0.069585-0.162706-0.14224-0.323365-0.214894-0.485047-0.243547-0.540306-0.500397-1.075495-0.775666-1.601474-0.035816-0.067538-0.066515-0.137123-0.102331-0.204661-0.305969-0.575098-0.636496-1.136893-0.979304-1.692548-0.095167-0.153496-0.191358-0.305969-0.289596-0.457418-0.333598-0.518816-0.678452-1.030469-1.043772-1.529843-0.032746-0.044002-0.062422-0.091074-0.095167-0.135076-0.398066-0.539282-0.820692-1.061169-1.255597-1.574868-0.107447-0.12689-0.215918-0.251733-0.325411-0.3776-0.451278-0.515746-0.913812-1.023306-1.400906-1.5104L688.452781 72.233138c-0.485047-0.485047-0.989537-0.945535-1.503237-1.393743-0.12996-0.113587-0.260943-0.227174-0.39295-0.338714-0.509606-0.430812-1.028423-0.850367-1.562589-1.245364-0.053212-0.038886-0.107447-0.074701-0.160659-0.112564-0.48914-0.357134-0.99056-0.695848-1.49812-1.022283-0.158612-0.102331-0.318248-0.203638-0.477884-0.301875-0.550539-0.339738-1.107217-0.667196-1.676176-0.970094-0.076748-0.040932-0.155543-0.076748-0.232291-0.116657-0.514723-0.26913-1.038656-0.51984-1.566682-0.759293-0.168846-0.075725-0.336668-0.151449-0.506537-0.224104-0.595564-0.255827-1.197268-0.499373-1.807159-0.717338-0.056282-0.019443-0.112564-0.036839-0.168846-0.056282-0.573051-0.200568-1.153266-0.38067-1.738597-0.547469-0.162706-0.046049-0.325411-0.092098-0.48914-0.1361-0.63752-0.169869-1.278109-0.327458-1.926886-0.456395-0.016373-0.00307-0.033769-0.005117-0.050142-0.00921-0.630357-0.124843-1.267876-0.223081-1.907443-0.308015-0.169869-0.022513-0.339738-0.044002-0.51063-0.063445-0.61296-0.070608-1.227967-0.127913-1.847068-0.161682-0.048095-0.00307-0.097214-0.008186-0.145309-0.011256-0.51063-0.025583-1.023306-0.038886-1.537006-0.038886L159.900803 63.24237c-16.95516 0-30.699186 13.744026-30.699186 30.699186l0 834.942133c0 16.954137 13.744026 30.699186 30.699186 30.699186L864.922958 959.582875c16.954137 0 30.699186-13.745049 30.699186-30.699186L895.622144 292.119127C895.622144 291.603381 895.607818 291.089681 895.582235 290.577005zM697.444573 168.05553l93.363388 93.363388-93.363388 0L697.444573 168.05553zM190.599989 898.184503 190.599989 124.640742l445.446211 0 0 167.478386c0 16.954137 13.745049 30.699186 30.699186 30.699186L834.223772 322.818313l0 575.36619L190.599989 898.184503z" />
    <path d="M287.332101 381.480364l197.455117 0c16.954137 0 30.699186-13.745049 30.699186-30.699186s-13.745049-30.699186-30.699186-30.699186L287.332101 320.081992c-16.954137 0-30.699186 13.745049-30.699186 30.699186S270.377964 381.480364 287.332101 381.480364z" />
    <path d="M287.332101 542.235628l259.913635 0c16.954137 0 30.699186-13.745049 30.699186-30.699186s-13.745049-30.699186-30.699186-30.699186L287.332101 480.837256c-16.954137 0-30.699186 13.745049-30.699186 30.699186S270.377964 542.235628 287.332101 542.235628z" />
    <path d="M679.258375 640.444371l-391.926274 0c-16.954137 0-30.699186 13.745049-30.699186 30.699186s13.745049 30.699186 30.699186 30.699186l391.926274 0c16.954137 0 30.699186-13.745049 30.699186-30.699186S696.212512 640.444371 679.258375 640.444371z" />
  </svg>
);

// Custom Book Icon component (Audiobook - matching homepage)
const BookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M846.848 925.696H179.2c-15.872 0-28.672-12.8-28.672-28.672V125.44c0-15.872 12.8-28.672 28.672-28.672h667.648c15.872 0 28.672 12.8 28.672 28.672v772.096c0 15.36-12.8 28.16-28.672 28.16zM212.992 863.744h600.064V159.232H212.992v704.512z" />
    <path d="M704.512 488.96c-4.096 0-7.68-0.512-11.264-2.048l-95.744-40.96-92.672 40.96c-9.216 4.096-18.944 2.56-27.136-2.048a28.672 28.672 0 0 1-12.8-24.064V125.44c0-15.872 12.8-28.672 28.672-28.672h210.944c15.872 0 28.672 12.8 28.672 28.672v334.848c0 9.728-5.12 18.432-12.8 24.064-5.12 3.072-10.24 4.608-15.872 4.608z m-107.52-102.912c4.096 0 7.68 0.512 11.264 2.048l67.072 28.672V153.6h-154.112v263.168l64-28.16c4.096-1.536 7.68-2.56 11.776-2.56z m-7.168 259.072H312.832c-15.872 0-28.672-12.8-28.672-28.672 0-15.872 12.8-28.672 28.672-28.672h276.48c15.872 0 28.672 12.8 28.672 28.672 0 15.872-12.288 28.672-28.16 28.672z m-137.216 139.264H312.832c-15.872 0-28.672-12.8-28.672-28.672 0-15.872 12.8-28.672 28.672-28.672h139.264c15.872 0 28.672 12.8 28.672 28.672 0 15.872-12.288 28.672-28.16 28.672z" />
  </svg>
);

// Custom Customer Service Icon component (matching homepage)
const CustomerServiceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M554.666667 810.666667v-42.666667h85.333333v42.666667h128v-384c-12.8-119.466667-110.933333-213.333333-234.666667-213.333334S311.466667 307.2 298.666667 426.666667v426.666666H213.333333v-298.666666h42.666667v-106.666667C256 294.4 379.733333 170.666667 533.333333 170.666667S810.666667 294.4 810.666667 448V554.666667h42.666666v298.666666h-298.666666v-42.666666z" />
  </svg>
);

const sidebarTabs = [
  { id: "tts", label: "Text to Speech", icon: MessageSquareText },
  { id: "clone", label: "Voice Clone", icon: Copy },
  { id: "edit", label: "Voice Edit", icon: Wand2 },
];

const voiceOptions = [
  { value: "qingchunshaoniu", label: "Pure Girl" },
  { value: "tianmeinvsheng", label: "Sweet Female" },
  { value: "cixingnansheng", label: "Magnetic Male" },
  { value: "wenzhongnansheng", label: "Steady Male" },
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
    title: "News Broadcast",
    description: "Step 3 Model Release",
    audioTitle: "Step 3 Release",
    icon: "news" as const,
    iconColor: "text-blue-500",
    text: "Hello everyone, welcome to today's tech news. Today we are reporting breaking news: Step Star has officially released the new Step 3 large language model. This model has achieved breakthrough results in multiple benchmark tests, reaching industry-leading levels in core capabilities such as logical reasoning, code generation, and multilingual understanding, marking a new milestone for domestic large models.",
  },
  {
    id: 2,
    title: "Audiobook",
    description: "Mystery Story",
    audioTitle: "Midnight Letter",
    icon: "book" as const,
    iconColor: "text-pink-500",
    text: "At midnight, the old mansion's clock struck twelve. Detective Li stood before the study door, his flashlight trembling slightly. Strange sounds came from behind the bookshelf, like someone flipping through pages. He took a deep breath and pushed open the dusty hidden door. The sight before him made him gasp—the walls were covered with yellowed photographs, each showing the same person, someone who had disappeared thirty years ago.",
  },
  {
    id: 3,
    title: "Customer Service",
    description: "AI Assistant Dialog",
    audioTitle: "Smart Assistant",
    icon: "service" as const,
    iconColor: "text-green-500",
    text: "Hello, welcome to the Step Star Customer Service Center. I am your intelligent voice assistant, Star. I'm happy to serve you! How may I help you today? You can inquire about product features, technical support, account issues, or business cooperation. I will do my best to provide you with professional and efficient answers. If you need to transfer to a human agent, please let me know.",
  },
  {
    id: 4,
    title: "Ad Voiceover",
    description: "Brand Promotion",
    audioTitle: "Brand Promo",
    icon: "mic" as const,
    iconColor: "text-violet-500",
    text: "In this rapidly changing era, we always believe in the power of technology. Step Star, with innovation as the engine and dreams as wings, is committed to creating cutting-edge artificial intelligence technology. From speech synthesis to intelligent dialogue, from text understanding to multimodal interaction, we use technology to connect the future and make every communication warm. Step Star, together with you, crossing the stars and seas.",
  },
  {
    id: 5,
    title: "Education",
    description: "Poetry Reading",
    audioTitle: "Quiet Night",
    icon: "education" as const,
    iconColor: "text-sky-500",
    text: "Before my bed, the moonlight gleams, like frost upon the ground it seems. I raise my head to watch the moon, then lower it, thinking of home. This poem 'Quiet Night Thoughts' is a famous five-character quatrain by the Tang Dynasty poet Li Bai. Through depicting a moonlit scene of homesickness, the poet expresses deep longing for his hometown with simple yet profound language. The poem has moved countless wanderers for thousands of years.",
  },
  {
    id: 6,
    title: "Emotional Radio",
    description: "Late Night Healing",
    audioTitle: "Night Healing",
    icon: "sparkles" as const,
    iconColor: "text-pink-500",
    text: "Dear listeners, welcome to Starlight Night Talk. On this quiet night, let me accompany you through this gentle time. Life may not always be smooth sailing, but please believe that every dawn brings new hope. No matter what you experienced today, remember to be gentle with yourself. Close your eyes, take a deep breath, and let my voice accompany you to sleep. Sweet dreams.",
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
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get current voice name for display
  const getCurrentVoiceName = () => {
    const systemVoice = voiceOptions.find(v => v.value === voice);
    if (systemVoice) return systemVoice.label;
    const customVoice = customVoices.find(v => v.id === voice);
    if (customVoice) return customVoice.name;
    return "Unknown Voice";
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
        const msg = (error as any)?.message || "Audio generation failed";

        if (
          status === 402 ||
          String(msg).includes("quota_exceeded") ||
          String(msg).includes(" 402")
        ) {
          toast.error("Quota exceeded. Please update your key or upgrade your plan.");
        } else {
          toast.error(msg);
        }
        return;
      }

      // The function may return JSON { error } (e.g. quota exceeded) with 200
      if (data && typeof data === "object" && "error" in (data as any)) {
        const upstreamStatus = (data as any).upstream_status;
        const message = String((data as any).error || "Audio generation failed");

        if (
          upstreamStatus === 402 ||
          message.includes("quota") ||
          message.includes("quota_exceeded")
        ) {
          toast.error("Quota exceeded. Please update your key or upgrade your plan.");
        } else {
          toast.error(message);
        }
        return;
      }

      const audioBlob =
        data instanceof Blob ? data : new Blob([data as any], { type: "audio/mpeg" });
      console.log("Audio blob size:", audioBlob.size);

      if (audioBlob.size === 0) {
        throw new Error("Generated audio is empty");
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
      toast.error(error instanceof Error ? error.message : "Audio generation failed. Please try again.");
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
        setCurrentAudioTitle("Custom Audio");
      }
      // Set voice name from current TTS settings
      const voiceName = voiceOptions.find(v => v.value === voice)?.label || 
                        customVoices.find(v => v.id === voice)?.name || 
                        "Unknown Voice";
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
                <span className="text-lg font-bold text-foreground">Step Star</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">Open Platform</span>
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </a>
              <Link to="/playground" className="flex items-center gap-1 text-sm text-primary font-medium">
                Playground
                <ChevronDown size={14} />
              </Link>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Star Program
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Official Website
              </a>
            </div>

            {/* Right: User Center */}
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              User Center
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground font-semibold hover:bg-accent"
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
                Contact Us
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-4" side="top" align="start">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground">Contact Info</h4>
                
                {/* Discord */}
                <a 
                  href="https://discord.gg/lovable-dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-[3px] hover:bg-accent transition-colors group"
                >
                  <div className="w-8 h-8 rounded-[3px] bg-[#5865F2] flex items-center justify-center">
                    <svg width="18" height="14" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5765 44.3433C53.9319 44.6363 54.3041 44.9293 54.6791 45.2082C54.8078 45.304 54.7994 45.5041 54.6595 45.5858C52.8909 46.6197 51.0522 47.4931 49.1183 48.2228C48.9924 48.2707 48.9364 48.4172 48.998 48.5383C50.0624 50.6034 51.2798 52.5699 52.6221 54.435C52.6781 54.5139 52.7788 54.5477 52.8712 54.5195C58.6726 52.7249 64.5553 50.0174 70.6282 45.5576C70.6814 45.5182 70.715 45.459 70.7206 45.3942C72.2165 30.0252 68.2127 16.7119 60.1963 4.9823C60.1768 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Discord Community</span>
                </a>

                {/* Email */}
                <a 
                  href="mailto:platform@stepfun.com"
                  className="flex items-center gap-3 p-2 rounded-[3px] hover:bg-accent transition-colors group"
                >
                  <div className="w-8 h-8 rounded-[3px] bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Email</span>
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
                <div className="bg-accent/30 border border-border rounded-[3px] p-1 mb-6 relative">
                  {text.length > 0 && (
                    <button
                      onClick={handleClear}
                      className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-[3px] transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <Textarea
                    placeholder="Enter the text you want to convert to audio..."
                    value={text}
                    onChange={handleTextChange}
                    maxLength={10000}
                    className="min-h-[300px] bg-transparent border-0 resize-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground pb-8 pr-10"
                  />
                  <div className="absolute bottom-3 right-4 text-sm text-muted-foreground">
                    {text.length}/10000 chars
                  </div>
                </div>

                {/* Generate Button - Show when text is entered but no audio yet */}
                {text.trim() && !audioUrl && !isGenerating && (
                  <div className="mb-6 flex justify-center">
                    <Button
                      onClick={handleGenerateClick}
                      className="gap-2 h-11 px-12 bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white font-semibold"
                    >
                      Generate Audio
                    </Button>
                  </div>
                )}

                {/* Generating State */}
                {isGenerating && (
                  <div className="mb-6 flex justify-center">
                    <Button
                      disabled
                      className="gap-2 h-11 px-12 bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white font-semibold"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </Button>
                  </div>
                )}

                {/* Audio Ready State - Show regenerate button */}
                {audioUrl && !isGenerating && (
                  <div className="mb-6 flex justify-center">
                    <Button
                      onClick={handleGenerateClick}
                      disabled={isGenerating || !text.trim()}
                      className="gap-2 bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white font-semibold"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </Button>
                  </div>
                )}

                {/* Case Samples - Compact horizontal tags */}
                {!text.trim() && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Select a scenario to experience voice synthesis</p>
                    <div className="flex flex-wrap gap-3">
                      {caseSamples.map((sample) => (
                          <button
                            key={sample.id}
                            onClick={() => handleCaseClick(sample)}
                            className="group flex items-center gap-2 px-4 py-2.5 rounded-[3px] border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200"
                          >
                            {sample.icon === "news" && <NewsIcon className={`w-5 h-5 ${sample.iconColor} shrink-0`} />}
                            {sample.icon === "book" && <BookIcon className={`w-5 h-5 ${sample.iconColor} shrink-0`} />}
                            {sample.icon === "service" && <CustomerServiceIcon className={`w-5 h-5 ${sample.iconColor} shrink-0`} />}
                            {sample.icon === "mic" && <Mic className={`w-5 h-5 ${sample.iconColor} shrink-0`} />}
                            {sample.icon === "education" && <GraduationCap className={`w-5 h-5 ${sample.iconColor} shrink-0`} />}
                            {sample.icon === "sparkles" && <Sparkles className={`w-5 h-5 ${sample.iconColor} shrink-0`} />}
                            <span className="font-medium text-sm text-foreground">{sample.title}</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-sm text-muted-foreground">{sample.description}</span>
                          </button>
                        ))}
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
                  setCurrentVoiceDisplayName("Cloned Voice");
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
                  setCurrentVoiceDisplayName("Edited Audio");
                  setShowPlayerBar(true);
                  setEditIsGenerating(false);
                }}
                onAudioDeleted={() => {
                  setShowPlayerBar(false);
                  setEditSentences([]);
                  setEditIsGenerating(false);
                  setEditGeneratingSentenceId(null);
                  setIsBatchGenerating(false);
                  setBatchProgress({ current: 0, total: 0 });
                }}
                onSentencesChange={setEditSentences}
                onGeneratingChange={(generating, title) => {
                  setEditIsGenerating(generating);
                  if (generating && title) {
                    setCurrentAudioTitle(title);
                    setCurrentVoiceDisplayName("Edited Audio");
                    setShowPlayerBar(true);
                  }
                }}
                onEditGeneratingChange={setEditGeneratingSentenceId}
                onBatchGeneratingChange={(generating, progress) => {
                  setIsBatchGenerating(generating);
                  setBatchProgress(progress);
                }}
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
                <label className="text-sm font-medium text-foreground mb-2 block">Voice</label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">System Voices</SelectLabel>
                      {voiceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {customVoices.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground">My Voices</SelectLabel>
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
                  <label className="text-sm font-medium text-foreground">Speed</label>
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
                  <label className="text-sm font-medium text-foreground">Volume</label>
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
                <label className="text-sm font-medium text-foreground mb-2 block">Format</label>
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
          onEditAll={() => {
            (window as any).__voiceEditOpenBatchModal?.();
          }}
          onDelete={() => {
            (window as any).__voiceEditDeleteAudio?.();
          }}
          onSentencesUpdate={setEditSentences}
          onSelectionChange={setEditSelectedSentenceId}
          onPlayingChange={setEditPlayingSentenceId}
          onTimeChange={(current, total) => {
            setEditCurrentTime(current);
            setEditDuration(total);
          }}
          editGeneratingId={editGeneratingSentenceId}
          isBatchGenerating={isBatchGenerating}
          batchProgress={batchProgress}
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
