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
    <path d="M895.582235 290.577005c-0.002047-0.040932-0.007163-0.080841-0.00921-0.121773-0.033769-0.627287-0.092098-1.251503-0.164752-1.87265-0.019443-0.165776-0.039909-0.331551-0.061398-0.49835-0.085958-0.649799-0.186242-1.297552-0.313132-1.938142-0.001023-0.007163-0.002047-0.013303-0.00307-0.020466-0.12996-0.652869-0.288572-1.299599-0.459464-1.941212-0.041956-0.156566-0.085958-0.312108-0.12996-0.468674-0.169869-0.596588-0.353041-1.190105-0.558725-1.774413-0.016373-0.046049-0.029676-0.092098-0.046049-0.138146-0.220011-0.61603-0.465604-1.222851-0.724501-1.823532-0.069585-0.162706-0.14224-0.323365-0.214894-0.485047-0.243547-0.540306-0.500397-1.075495-0.775666-1.601474-0.035816-0.067538-0.066515-0.137123-0.102331-0.204661-0.305969-0.575098-0.636496-1.136893-0.979304-1.692548-0.095167-0.153496-0.191358-0.305969-0.289596-0.457418-0.333598-0.518816-0.678452-1.030469-1.043772-1.529843-0.032746-0.044002-0.062422-0.091074-0.095167-0.135076-0.398066-0.539282-0.820692-1.061169-1.255597-1.574868-0.107447-0.12689-0.215918-0.251733-0.325411-0.3776-0.451278-0.515746-0.913812-1.023306-1.400906-1.5104L688.452781 72.233138c-0.485047-0.485047-0.989537-0.945535-1.503237-1.393743-0.12996-0.113587-0.260943-0.227174-0.39295-0.338714-0.509606-0.430812-1.028423-0.850367-1.562589-1.245364-0.053212-0.038886-0.107447-0.074701-0.160659-0.112564-0.48914-0.357134-0.99056-0.695848-1.49812-1.022283-0.158612-0.102331-0.318248-0.203638-0.477884-0.301875-0.550539-0.339738-1.107217-0.667196-1.676176-0.970094-0.076748-0.040932-0.155543-0.076748-0.232291-0.116657-0.514723-0.26913-1.038656-0.51984-1.566682-0.759293-0.168846-0.075725-0.336668-0.151449-0.506537-0.224104-0.595564-0.255827-1.197268-0.499373-1.807159-0.717338-0.056282-0.019443-0.112564-0.036839-0.168846-0.056282-0.573051-0.200568-1.153266-0.38067-1.738597-0.547469-0.162706-0.046049-0.325411-0.092098-0.48914-0.1361-0.63752-0.169869-1.278109-0.327458-1.926886-0.456395-0.016373-0.00307-0.033769-0.005117-0.050142-0.00921-0.630357-0.124843-1.267876-0.223081-1.907443-0.308015-0.169869-0.022513-0.339738-0.044002-0.51063-0.063445-0.61296-0.070608-1.227967-0.127913-1.847068-0.161682-0.048095-0.00307-0.097214-0.008186-0.145309-0.011256-0.51063-0.025583-1.023306-0.038886-1.537006-0.038886L159.900803 63.24237c-16.95516 0-30.699186 13.744026-30.699186 30.699186l0 834.942133c0 16.954137 13.744026 30.699186 30.699186 30.699186L864.922958 959.582875c16.954137 0 30.699186-13.745049 30.699186-30.699186L895.622144 292.119127C895.622144 291.603381 895.607818 291.089681 895.582235 290.577005zM697.444573 168.05553l93.363388 93.363388-93.363388 0L697.444573 168.05553zM190.599989 898.184503 190.599989 124.640742l445.446211 0 0 167.478386c0 16.954137 13.745049 30.699186 30.699186 30.699186L834.223772 322.818313l0 575.36619L190.599989 898.184503z" />
    <path d="M287.332101 381.480364l197.455117 0c16.954137 0 30.699186-13.745049 30.699186-30.699186s-13.745049-30.699186-30.699186-30.699186L287.332101 320.081992c-16.954137 0-30.699186 13.745049-30.699186 30.699186S270.377964 381.480364 287.332101 381.480364z" />
    <path d="M287.332101 542.235628l259.913635 0c16.954137 0 30.699186-13.745049 30.699186-30.699186s-13.745049-30.699186-30.699186-30.699186L287.332101 480.837256c-16.954137 0-30.699186 13.745049-30.699186 30.699186S270.377964 542.235628 287.332101 542.235628z" />
    <path d="M679.258375 640.444371l-391.926274 0c-16.954137 0-30.699186 13.745049-30.699186 30.699186s13.745049 30.699186 30.699186 30.699186l391.926274 0c16.954137 0 30.699186-13.745049 30.699186-30.699186S696.212512 640.444371 679.258375 640.444371z" />
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
      <div className="bg-white border border-[#e5e0f5] rounded-[3px] p-6 mb-4 min-h-[160px] shadow-sm">
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
              flex items-center gap-2.5 px-4 py-2.5 rounded-[3px] border transition-all duration-200 shadow-sm
              ${activeCase === caseItem.id 
                ? 'bg-gradient-to-r from-[#f8f5ff] to-[#f0e8ff] border-[#c4b5fd]/50' 
                : 'bg-white border-[#e5e0f5] hover:border-[#c4b5fd]/50'
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
          className="gap-2.5 px-6 py-2.5 h-auto text-base font-semibold bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-lg shadow-[#7c3aed]/25 hover:shadow-xl hover:shadow-[#7c3aed]/30 transition-all duration-300"
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
