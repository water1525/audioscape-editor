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
    text: "Step Star has officially released the new Step 3 large language model, combining intelligence and efficiency, creating the most suitable model for applications in the reasoning era. Step 3 will be open-sourced globally for enterprises and developers, contributing the most powerful multimodal reasoning model to the open-source world.",
  },
  case2: {
    voice: "tianmeinvsheng", 
    text: "Late at night, the old mansion's clock struck twelve. She pushed open the dusty attic door and found a yellowed letter—the recipient was her own name, but the date was tomorrow. There was only one sentence: Do not look back. Her heart raced as footsteps echoed softly behind her. She held her breath and slowly turned around, only to see an empty hallway and a dusty mirror. In the reflection, she was smiling, but she wasn't smiling at all.",
  },
};

const dialogueLines = [
  { speaker: "Agent May", text: "Hello, welcome to our Smart Customer Service Center. How may I help you?", voice: "tianmeinvsheng" },
  { speaker: "Mr. Customer", text: "Hi, my order from yesterday shows shipped, but the tracking hasn't updated.", voice: "cixingnansheng" },
  { speaker: "Agent May", text: "Sure, please provide your order number and I'll look it up for you.", voice: "tianmeinvsheng" },
  { speaker: "Mr. Customer", text: "The order number is 202412250001.", voice: "cixingnansheng" },
  { speaker: "Agent May", text: "Found it. Your package is currently in transit and expected to arrive tomorrow. Please be patient.", voice: "tianmeinvsheng" },
  { speaker: "Mr. Customer", text: "Great, thank you!", voice: "cixingnansheng" },
];

// Custom News Icon component
const NewsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M146.285714 292.571429l585.142857 0 0 73.142857-585.142857 0 0-73.142857Z" />
    <path d="M146.285714 475.428571l219.428571 0 0 256-219.428571 0 0-256Z" />
    <path d="M438.857143 475.428571l292.571429 0 0 36.571429-292.571429 0 0-36.571429Z" />
    <path d="M438.857143 585.142857l292.571429 0 0 36.571429-292.571429 0 0-36.571429Z" />
    <path d="M438.857143 694.857143l292.571429 0 0 36.571429-292.571429 0 0-36.571429Z" />
    <path d="M987.428571 292.571429l-109.714286 0L877.714286 109.714286c0-20.196571-16.356571-36.571429-36.571429-36.571429L36.571429 73.142857C16.3584 73.142857 0 89.517714 0 109.714286l0 804.571429c0 20.214857 16.356571 36.571429 36.571429 36.571429l950.857143 0c20.214857 0 36.571429-16.356571 36.571429-36.571429L1024 329.142857C1024 308.946286 1007.643429 292.571429 987.428571 292.571429zM804.571429 877.714286 73.142857 877.714286 73.142857 146.285714l731.428571 0L804.571429 877.714286zM950.857143 877.714286l-73.142857 0L877.714286 365.714286l73.142857 0L950.857143 877.714286z" />
  </svg>
);

// Custom Book Icon component (Audiobook)
const BookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M846.848 925.696H179.2c-15.872 0-28.672-12.8-28.672-28.672V125.44c0-15.872 12.8-28.672 28.672-28.672h667.648c15.872 0 28.672 12.8 28.672 28.672v772.096c0 15.36-12.8 28.16-28.672 28.16zM212.992 863.744h600.064V159.232H212.992v704.512z" />
    <path d="M704.512 488.96c-4.096 0-7.68-0.512-11.264-2.048l-95.744-40.96-92.672 40.96c-9.216 4.096-18.944 2.56-27.136-2.048a28.672 28.672 0 0 1-12.8-24.064V125.44c0-15.872 12.8-28.672 28.672-28.672h210.944c15.872 0 28.672 12.8 28.672 28.672v334.848c0 9.728-5.12 18.432-12.8 24.064-5.12 3.072-10.24 4.608-15.872 4.608z m-107.52-102.912c4.096 0 7.68 0.512 11.264 2.048l67.072 28.672V153.6h-154.112v263.168l64-28.16c4.096-1.536 7.68-2.56 11.776-2.56z m-7.168 259.072H312.832c-15.872 0-28.672-12.8-28.672-28.672 0-15.872 12.8-28.672 28.672-28.672h276.48c15.872 0 28.672 12.8 28.672 28.672 0 15.872-12.288 28.672-28.16 28.672z m-137.216 139.264H312.832c-15.872 0-28.672-12.8-28.672-28.672 0-15.872 12.8-28.672 28.672-28.672h139.264c15.872 0 28.672 12.8 28.672 28.672 0 15.872-12.288 28.672-28.16 28.672z" />
  </svg>
);

// Custom Customer Service Icon component
const CustomerServiceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M554.666667 810.666667v-42.666667h85.333333v42.666667h128v-384c-12.8-119.466667-110.933333-213.333333-234.666667-213.333334S311.466667 307.2 298.666667 426.666667v426.666666H213.333333v-298.666666h42.666667v-106.666667C256 294.4 379.733333 170.666667 533.333333 170.666667S810.666667 294.4 810.666667 448V554.666667h42.666666v298.666666h-298.666666v-42.666666z" />
  </svg>
);

const cases = [
  {
    id: "case1",
    label: "News Broadcast",
    description: "Step 3 Model Release",
    audioTitle: "Step 3 Release",
    icon: "news" as const,
    iconColor: "text-blue-500",
    gradient: "from-blue-400 to-cyan-400",
    text: voiceConfigs.case1.text,
    isDialogue: false,
  },
  {
    id: "case2",
    label: "Audiobook",
    description: "Mystery Story",
    audioTitle: "Midnight Letter",
    icon: "book" as const,
    iconColor: "text-pink-500",
    gradient: "from-purple-400 to-pink-400",
    text: voiceConfigs.case2.text,
    isDialogue: false,
  },
  {
    id: "case3",
    label: "Customer Service",
    description: "AI Assistant Dialog",
    audioTitle: "Order Inquiry",
    icon: "service" as const,
    iconColor: "text-green-500",
    gradient: "from-green-400 to-emerald-400",
    text: dialogueLines.map(line => `${line.speaker}: ${line.text}`).join("\n"),
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
      toast.info("Generating audio...");
      audioUrl = await generateSingleAudio(config.text, config.voice);
      setIsGenerating(false);
      
      if (!audioUrl) {
        toast.error("Audio generation failed");
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
      toast.error("Audio playback failed");
    };

    audio.play();
    setIsPlaying(true);
  };

  // Play dialogue sequentially
  const playDialogue = async () => {
    dialogueIndexRef.current = 0;
    setIsPlaying(true);
    setIsGenerating(true);
    toast.info("Generating dialogue audio...");

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
          toast.error("Dialogue audio generation failed");
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
        toast.error("Audio playback failed");
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
      <div className="bg-card border border-border rounded-[3px] p-6 mb-4 min-h-[160px] shadow-soft">
        <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">
          {currentCase.text}
        </p>
      </div>

      {/* Case Selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {cases.map((caseItem) => (
          <button
            key={caseItem.id}
            onClick={() => handleCaseChange(caseItem.id)}
            className={`
              flex items-center gap-2.5 px-4 py-2.5 rounded-[3px] border transition-all duration-200
              ${activeCase === caseItem.id 
                ? 'bg-primary/10 border-primary/50 shadow-md shadow-primary/10' 
                : 'bg-card/50 border-border/50 hover:bg-card hover:border-border'
              }
            `}
          >
            {caseItem.icon === "news" && <NewsIcon className={`w-6 h-6 ${caseItem.iconColor}`} />}
            {caseItem.icon === "book" && <BookIcon className={`w-6 h-6 ${caseItem.iconColor}`} />}
            {caseItem.icon === "service" && <CustomerServiceIcon className={`w-6 h-6 ${caseItem.iconColor}`} />}
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
          Generate hyper-realistic speech with rich emotions and styles
        </p>
        <Button 
          className="gap-2.5 px-6 py-2.5 h-auto text-base font-semibold bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white shadow-lg shadow-[hsl(221,100%,43%)]/25 hover:shadow-xl hover:shadow-[hsl(221,100%,43%)]/30 transition-all duration-300"
          onClick={handlePlayPause}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <WaveformAnimation isPlaying={true} variant="small" barCount={3} className="text-primary-foreground [&>div]:bg-primary-foreground" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isGenerating ? "Generating..." : isPlaying ? "Playing" : "Play"}
        </Button>
      </div>
    </div>
  );
};

export default TextToSpeechTab;
