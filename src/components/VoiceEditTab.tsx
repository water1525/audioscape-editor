import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, Upload, Mic, RefreshCw, X, Loader2, ChevronLeft, ChevronRight, Pencil, GraduationCap, Sparkles } from "lucide-react";
import DeleteIcon from "@/components/ui/DeleteIcon";
import { toast } from "sonner";

// Custom News Icon component (matching homepage/playground)
const NewsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M895.582235 290.577005c-0.002047-0.040932-0.007163-0.080841-0.00921-0.121773-0.033769-0.627287-0.092098-1.251503-0.164752-1.87265-0.019443-0.165776-0.039909-0.331551-0.061398-0.49835-0.085958-0.649799-0.186242-1.297552-0.313132-1.938142-0.001023-0.007163-0.002047-0.013303-0.00307-0.020466-0.12996-0.652869-0.288572-1.299599-0.459464-1.941212-0.041956-0.156566-0.085958-0.312108-0.12996-0.468674-0.169869-0.596588-0.353041-1.190105-0.558725-1.774413-0.016373-0.046049-0.029676-0.092098-0.046049-0.138146-0.220011-0.61603-0.465604-1.222851-0.724501-1.823532-0.069585-0.162706-0.14224-0.323365-0.214894-0.485047-0.243547-0.540306-0.500397-1.075495-0.775666-1.601474-0.035816-0.067538-0.066515-0.137123-0.102331-0.204661-0.305969-0.575098-0.636496-1.136893-0.979304-1.692548-0.095167-0.153496-0.191358-0.305969-0.289596-0.457418-0.333598-0.518816-0.678452-1.030469-1.043772-1.529843-0.032746-0.044002-0.062422-0.091074-0.095167-0.135076-0.398066-0.539282-0.820692-1.061169-1.255597-1.574868-0.107447-0.12689-0.215918-0.251733-0.325411-0.3776-0.451278-0.515746-0.913812-1.023306-1.400906-1.5104L688.452781 72.233138c-0.485047-0.485047-0.989537-0.945535-1.503237-1.393743-0.12996-0.113587-0.260943-0.227174-0.39295-0.338714-0.509606-0.430812-1.028423-0.850367-1.562589-1.245364-0.053212-0.038886-0.107447-0.074701-0.160659-0.112564-0.48914-0.357134-0.99056-0.695848-1.49812-1.022283-0.158612-0.102331-0.318248-0.203638-0.477884-0.301875-0.550539-0.339738-1.107217-0.667196-1.676176-0.970094-0.076748-0.040932-0.155543-0.076748-0.232291-0.116657-0.514723-0.26913-1.038656-0.51984-1.566682-0.759293-0.168846-0.075725-0.336668-0.151449-0.506537-0.224104-0.595564-0.255827-1.197268-0.499373-1.807159-0.717338-0.056282-0.019443-0.112564-0.036839-0.168846-0.056282-0.573051-0.200568-1.153266-0.38067-1.738597-0.547469-0.162706-0.046049-0.325411-0.092098-0.48914-0.1361-0.63752-0.169869-1.278109-0.327458-1.926886-0.456395-0.016373-0.00307-0.033769-0.005117-0.050142-0.00921-0.630357-0.124843-1.267876-0.223081-1.907443-0.308015-0.169869-0.022513-0.339738-0.044002-0.51063-0.063445-0.61296-0.070608-1.227967-0.127913-1.847068-0.161682-0.048095-0.00307-0.097214-0.008186-0.145309-0.011256-0.51063-0.025583-1.023306-0.038886-1.537006-0.038886L159.900803 63.24237c-16.95516 0-30.699186 13.744026-30.699186 30.699186l0 834.942133c0 16.954137 13.744026 30.699186 30.699186 30.699186L864.922958 959.582875c16.954137 0 30.699186-13.745049 30.699186-30.699186L895.622144 292.119127C895.622144 291.603381 895.607818 291.089681 895.582235 290.577005zM697.444573 168.05553l93.363388 93.363388-93.363388 0L697.444573 168.05553zM190.599989 898.184503 190.599989 124.640742l445.446211 0 0 167.478386c0 16.954137 13.745049 30.699186 30.699186 30.699186L834.223772 322.818313l0 575.36619L190.599989 898.184503z" />
    <path d="M287.332101 381.480364l197.455117 0c16.954137 0 30.699186-13.745049 30.699186-30.699186s-13.745049-30.699186-30.699186-30.699186L287.332101 320.081992c-16.954137 0-30.699186 13.745049-30.699186 30.699186S270.377964 381.480364 287.332101 381.480364z" />
    <path d="M287.332101 542.235628l259.913635 0c16.954137 0 30.699186-13.745049 30.699186-30.699186s-13.745049-30.699186-30.699186-30.699186L287.332101 480.837256c-16.954137 0-30.699186 13.745049-30.699186 30.699186S270.377964 542.235628 287.332101 542.235628z" />
    <path d="M679.258375 640.444371l-391.926274 0c-16.954137 0-30.699186 13.745049-30.699186 30.699186s13.745049 30.699186 30.699186 30.699186l391.926274 0c16.954137 0 30.699186-13.745049 30.699186-30.699186S696.212512 640.444371 679.258375 640.444371z" />
  </svg>
);

// Custom Book Icon component (Audiobook - matching homepage/playground)
const BookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M846.848 925.696H179.2c-15.872 0-28.672-12.8-28.672-28.672V125.44c0-15.872 12.8-28.672 28.672-28.672h667.648c15.872 0 28.672 12.8 28.672 28.672v772.096c0 15.36-12.8 28.16-28.672 28.16zM212.992 863.744h600.064V159.232H212.992v704.512z" />
    <path d="M704.512 488.96c-4.096 0-7.68-0.512-11.264-2.048l-95.744-40.96-92.672 40.96c-9.216 4.096-18.944 2.56-27.136-2.048a28.672 28.672 0 0 1-12.8-24.064V125.44c0-15.872 12.8-28.672 28.672-28.672h210.944c15.872 0 28.672 12.8 28.672 28.672v334.848c0 9.728-5.12 18.432-12.8 24.064-5.12 3.072-10.24 4.608-15.872 4.608z m-107.52-102.912c4.096 0 7.68 0.512 11.264 2.048l67.072 28.672V153.6h-154.112v263.168l64-28.16c4.096-1.536 7.68-2.56 11.776-2.56z m-7.168 259.072H312.832c-15.872 0-28.672-12.8-28.672-28.672 0-15.872 12.8-28.672 28.672-28.672h276.48c15.872 0 28.672 12.8 28.672 28.672 0 15.872-12.288 28.672-28.16 28.672z m-137.216 139.264H312.832c-15.872 0-28.672-12.8-28.672-28.672 0-15.872 12.8-28.672 28.672-28.672h139.264c15.872 0 28.672 12.8 28.672 28.672 0 15.872-12.288 28.672-28.16 28.672z" />
  </svg>
);

// Custom Customer Service Icon component (matching homepage/playground)
const CustomerServiceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 1024 1024" className={className} fill="currentColor">
    <path d="M554.666667 810.666667v-42.666667h85.333333v42.666667h128v-384c-12.8-119.466667-110.933333-213.333333-234.666667-213.333334S311.466667 307.2 298.666667 426.666667v426.666666H213.333333v-298.666666h42.666667v-106.666667C256 294.4 379.733333 170.666667 533.333333 170.666667S810.666667 294.4 810.666667 448V554.666667h42.666666v298.666666h-298.666666v-42.666666z" />
  </svg>
);

// Preset scenarios for quick generation
const presetScenarios = [
  { id: "news", icon: "news" as const, title: "News Broadcast", subtitle: "Step 3 Release", color: "text-blue-500", text: "Breaking news: Step 3 voice model is officially released, supporting natural speech synthesis with various emotional styles, bringing users a more realistic voice experience." },
  { id: "audiobook", icon: "book" as const, title: "Audiobook", subtitle: "Mystery Story", color: "text-pink-500", text: "On that rainy night, he walked alone on the empty street. Suddenly, a flash of lightning split the night sky, and he saw a mysterious figure standing at the corner." },
  { id: "service", icon: "service" as const, title: "Customer Service", subtitle: "AI Assistant", color: "text-green-500", text: "Hello, welcome to our Customer Service Center. I am your intelligent customer service assistant. How may I help you today?" },
  { id: "ad", icon: "mic" as const, title: "Ad Voiceover", subtitle: "Brand Promo", color: "text-violet-500", text: "Explore infinite possibilities, create a brilliant future. We use technology to change lives and innovation to define tomorrow." },
  { id: "education", icon: "education" as const, title: "Education", subtitle: "Poetry Reading", color: "text-sky-500", text: "Before my bed, the moonlight gleams, like frost upon the ground it seems. I raise my head to watch the moon, then lower it, thinking of home." },
  { id: "radio", icon: "sparkles" as const, title: "Emotional Radio", subtitle: "Late Night Healing", color: "text-cyan-500", text: "On this quiet night, let us slow down together and listen to the voice within. May you have sweet dreams tonight and still be filled with hope tomorrow." },
];

// Sample texts for recording (~50 characters each, 10-30s reading time)
const sampleTexts = [
  "In this rapidly evolving era, technology has transformed our way of life, enabling us to communicate and interact with people around the world more conveniently.",
  "The warm spring sunshine brightens the day as flowers bloom and birds sing on the branches, everything appears full of vitality in this season of renewal.",
  "Artificial intelligence technology is profoundly changing various industries, from medical diagnosis to autonomous driving, its applications are becoming increasingly widespread.",
  "The city lights shine brilliantly at night, warm light emanates from the windows of tall buildings, while traffic flows through the streets as people hurry to their destinations.",
  "Music is a universal language that transcends cultural and geographical boundaries, touching the softest part of everyone's heart and bringing endless emotion and resonance.",
];

const emotionTags = ["Happy", "Angry", "Sad", "Humorous", "Confused", "Disgusted", "Empathetic", "Embarrassed", "Fearful", "Surprised", "Excited", "Depressed", "Indifferent", "Admiring"];
const styleTags = [
  "Serious", "Arrogant", "Childlike", "Innocent", "Exaggerated", "Girlish", "Mature", "Reciting",
  "Sweet", "Ethereal", "Bold", "Coquettish", "Warm", "Shy", "Comforting", "Authoritative",
  "Casual", "Radio", "Affectionate", "Gentle", "Magnetic", "Elderly", "Whispering",
  "Bubbly", "Storytelling", "Vivid", "Hosting", "News Anchor", "Advertising",
  "Gossip", "Shouting", "Soft", "Loud", "Deep", "High-pitched"
];
const speedTags = ["Fast", "Slow", "Faster", "Slower"];

export interface SentenceSegment {
  id: number;
  text: string;
  isEdited: boolean;
  versions: { url: string; tags: string[] }[];
  currentVersionIndex: number;
}

interface VoiceEditTabProps {
  onAudioGenerated?: (audioUrl: string, title: string) => void;
  onAudioDeleted?: () => void;
  onSentencesChange?: (sentences: SentenceSegment[]) => void;
  onGeneratingChange?: (isGenerating: boolean, title?: string) => void;
  onEditGeneratingChange?: (sentenceId: number | null) => void;
  onBatchGeneratingChange?: (isGenerating: boolean, progress: { current: number; total: number }) => void;
}

const VoiceEditTab = ({ onAudioGenerated, onAudioDeleted, onSentencesChange, onGeneratingChange, onEditGeneratingChange, onBatchGeneratingChange }: VoiceEditTabProps) => {
  // Upload/Record state
  const [audioSource, setAudioSource] = useState<"none" | "upload" | "record">("none");
  const [originalAudioBlob, setOriginalAudioBlob] = useState<Blob | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");
  
  // Recording state
  const [sampleText, setSampleText] = useState(sampleTexts[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(30);
  
  // Sentence segments state
  const [sentences, setSentences] = useState<SentenceSegment[]>([]);
  const [editingSentenceId, setEditingSentenceId] = useState<number | null>(null);
  const [isBatchEdit, setIsBatchEdit] = useState(false);
  
  // Edit state
  const [showModal, setShowModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPreset, setIsGeneratingPreset] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Notify parent when sentences change
  useEffect(() => {
    onSentencesChange?.(sentences);
  }, [sentences, onSentencesChange]);

  // Split text into sentences
  const splitIntoSentences = (text: string): string[] => {
    return text
      .split(/[。！？，；]/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());
  };

  // Generate random sample text
  const generateRandomText = () => {
    const currentIndex = sampleTexts.indexOf(sampleText);
    let newIndex = Math.floor(Math.random() * sampleTexts.length);
    while (newIndex === currentIndex && sampleTexts.length > 1) {
      newIndex = Math.floor(Math.random() * sampleTexts.length);
    }
    setSampleText(sampleTexts[newIndex]);
  };

  // Handle preset scenario click
  const handlePresetClick = async (scenario: typeof presetScenarios[0]) => {
    if (isGeneratingPreset) return;
    
    setIsGeneratingPreset(scenario.id);
    
    // Immediately show next step with sentences
    const sentenceTexts = splitIntoSentences(scenario.text);
    const newSentences: SentenceSegment[] = sentenceTexts.map((text, index) => ({
      id: index,
      text,
      isEdited: false,
      versions: [],
      currentVersionIndex: -1,
    }));
    setSentences(newSentences);
    setAudioSource("record");
    
    // Notify parent that we're generating
    onGeneratingChange?.(true, `${scenario.title} - ${scenario.subtitle}`);
    
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
          body: JSON.stringify({
            text: scenario.text,
            voice: "tianmeinvsheng",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      setOriginalAudioBlob(audioBlob);
      setOriginalAudioUrl(url);
      setOriginalFileName(`${scenario.title}_${scenario.subtitle}.wav`);
      
      onAudioGenerated?.(url, `${scenario.title} - ${scenario.subtitle}`);
      toast.success(`${scenario.title} audio generated successfully`);
    } catch (error) {
      console.error("Error generating preset audio:", error);
      toast.error("Audio generation failed, please try again");
      // Reset state on error
      setSentences([]);
      setAudioSource("none");
    } finally {
      setIsGeneratingPreset(null);
      onGeneratingChange?.(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file (mp3, wav, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setOriginalAudioBlob(file);
    setOriginalAudioUrl(url);
    setOriginalFileName(file.name);
    setAudioSource("upload");
    setSentences([]);
    toast.success("Audio uploaded successfully");
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setOriginalAudioBlob(audioBlob);
        setOriginalAudioUrl(url);
        setOriginalFileName(`Recording_${Date.now()}.wav`);
        setAudioSource("record");
        stream.getTracks().forEach(track => track.stop());
        
        // Split the sample text into sentences
        const sentenceTexts = splitIntoSentences(sampleText);
        const newSentences: SentenceSegment[] = sentenceTexts.map((text, index) => ({
          id: index,
          text,
          isEdited: false,
          versions: [],
          currentVersionIndex: -1,
        }));
        setSentences(newSentences);
        
        // Notify parent with the first audio
        onAudioGenerated?.(url, "Recorded Audio");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(30);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      toast.success("Recording started, please read the text");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Cannot access microphone, please check permissions");
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      toast.success("Recording completed");
    }
  }, [isRecording]);

  // Auto stop when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isRecording) {
      stopRecording();
    }
  }, [countdown, isRecording, stopRecording]);

  // Delete audio
  const deleteAudio = () => {
    if (originalAudioUrl) {
      URL.revokeObjectURL(originalAudioUrl);
    }
    sentences.forEach(sentence => {
      sentence.versions.forEach(v => URL.revokeObjectURL(v.url));
    });
    setOriginalAudioBlob(null);
    setOriginalAudioUrl(null);
    setOriginalFileName("");
    setAudioSource("none");
    setSentences([]);
    onAudioDeleted?.();
  };

  // Open edit modal for a sentence (called from parent)
  const openEditModal = (sentenceId: number) => {
    setEditingSentenceId(sentenceId);
    setShowModal(true);
  };

  // Expose openEditModal and openBatchEditModal to parent
  useEffect(() => {
    (window as any).__voiceEditOpenModal = openEditModal;
    (window as any).__voiceEditOpenBatchModal = openBatchEditModal;
    (window as any).__voiceEditDeleteAudio = deleteAudio;
    return () => {
      delete (window as any).__voiceEditOpenModal;
      delete (window as any).__voiceEditOpenBatchModal;
      delete (window as any).__voiceEditDeleteAudio;
    };
  }, []);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Handle edit confirm for a sentence or batch
  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      toast.error("Please select at least one parameter");
      return;
    }
    
    const currentTags = [...selectedTags];
    setShowModal(false);
    setSelectedTags([]);
    
    // Batch edit all sentences
    if (isBatchEdit) {
      setIsBatchGenerating(true);
      setBatchProgress({ current: 0, total: sentences.length });
      onBatchGeneratingChange?.(true, { current: 0, total: sentences.length });
      
      try {
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i];
          const progress = { current: i + 1, total: sentences.length };
          setBatchProgress(progress);
          onBatchGeneratingChange?.(true, progress);
          onEditGeneratingChange?.(sentence.id);
          
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/step-tts`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                text: sentence.text,
                voice: "tianmeinvsheng",
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to generate audio for sentence ${i + 1}`);
          }

          const audioBlob = await response.blob();
          const url = URL.createObjectURL(audioBlob);
          
          setSentences(prev => prev.map(s => {
            if (s.id === sentence.id) {
              const newVersions = [...s.versions, { url, tags: currentTags }];
              return {
                ...s,
                isEdited: true,
                versions: newVersions,
                currentVersionIndex: newVersions.length - 1,
              };
            }
            return s;
          }));
        }
        
        toast.success(`All ${sentences.length} sentences edited successfully`);
      } catch (error) {
        console.error("Error in batch generation:", error);
        toast.error("Batch editing failed, please try again");
      } finally {
        setIsBatchGenerating(false);
        setIsBatchEdit(false);
        setBatchProgress({ current: 0, total: 0 });
        onBatchGeneratingChange?.(false, { current: 0, total: 0 });
        onEditGeneratingChange?.(null);
      }
      return;
    }
    
    // Single sentence edit
    if (editingSentenceId === null) return;
    
    const sentence = sentences.find(s => s.id === editingSentenceId);
    if (!sentence) return;
    
    setIsGenerating(true);
    const currentEditingSentenceId = editingSentenceId;
    onEditGeneratingChange?.(currentEditingSentenceId);
    
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
          body: JSON.stringify({
            text: sentence.text,
            voice: "tianmeinvsheng",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate edited audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      setSentences(prev => prev.map(s => {
        if (s.id === editingSentenceId) {
          const newVersions = [...s.versions, { url, tags: currentTags }];
          return {
            ...s,
            isEdited: true,
            versions: newVersions,
            currentVersionIndex: newVersions.length - 1,
          };
        }
        return s;
      }));
      
      // Do not call onAudioGenerated for sentence edits - we don't want to change the title
      toast.success(`Sentence edited successfully, applied ${currentTags.length} style tags`);
    } catch (error) {
      console.error("Error generating edited audio:", error);
      toast.error("Audio editing failed, please try again");
    } finally {
      setIsGenerating(false);
      setEditingSentenceId(null);
      onEditGeneratingChange?.(null);
    }
  };

  // Open batch edit modal
  const openBatchEditModal = () => {
    setIsBatchEdit(true);
    setEditingSentenceId(null);
    setShowModal(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (originalAudioUrl) {
        URL.revokeObjectURL(originalAudioUrl);
      }
      sentences.forEach(sentence => {
        sentence.versions.forEach(v => URL.revokeObjectURL(v.url));
      });
    };
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Initial State: Upload or Record */}
      {audioSource === "none" && !isRecording && (
        <div className="space-y-6">
          {/* Upload/Record Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-[3px] p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <svg 
                  width="80" 
                  height="60" 
                  viewBox="0 0 80 60" 
                  fill="none"
                  className="text-primary"
                >
                  <path 
                    d="M5 30 L10 30 L15 20 L20 40 L25 15 L30 45 L35 10 L40 50 L45 5 L50 55 L55 20 L60 35 L65 25 L70 30 L75 30" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute -top-2 -right-4">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    className="text-primary"
                  >
                    <path 
                      d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      fill="hsl(var(--primary) / 0.1)"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Select an audio file or record directly
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports mp3/wav format, duration 10-30s
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 font-semibold"
                >
                  <Upload className="h-4 w-4" />
                  Upload Audio
                </Button>
                <Button
                  onClick={startRecording}
                  className="gap-2 bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white font-semibold"
                >
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
              </div>
            </div>
          </div>

          {/* Preset Scenarios */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select a scenario to experience voice editing</p>
            <div className="flex flex-wrap gap-3">
              {presetScenarios.map((scenario) => {
                const bgColorMap: Record<string, string> = {
                  "text-blue-500": "bg-blue-100 hover:bg-blue-200",
                  "text-pink-500": "bg-pink-100 hover:bg-pink-200",
                  "text-green-500": "bg-green-100 hover:bg-green-200",
                  "text-violet-500": "bg-violet-100 hover:bg-violet-200",
                  "text-sky-500": "bg-sky-100 hover:bg-sky-200",
                  "text-amber-500": "bg-amber-100 hover:bg-amber-200",
                  "text-cyan-500": "bg-cyan-100 hover:bg-cyan-200",
                };
                const bgColor = bgColorMap[scenario.color] || "bg-primary/10 hover:bg-primary/20";
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handlePresetClick(scenario)}
                    disabled={isGeneratingPreset !== null}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[3px] ${bgColor} transition-all duration-200 font-hfterse ${
                      isGeneratingPreset === scenario.id ? "opacity-70" : ""
                    }`}
                  >
                    {isGeneratingPreset === scenario.id ? (
                      <Loader2 className={`w-5 h-5 ${scenario.color} animate-spin shrink-0`} />
                    ) : (
                      <>
                        {scenario.icon === "news" && <NewsIcon className={`w-5 h-5 ${scenario.color} shrink-0`} />}
                        {scenario.icon === "book" && <BookIcon className={`w-5 h-5 ${scenario.color} shrink-0`} />}
                        {scenario.icon === "service" && <CustomerServiceIcon className={`w-5 h-5 ${scenario.color} shrink-0`} />}
                        {scenario.icon === "mic" && <Mic className={`w-5 h-5 ${scenario.color} shrink-0`} />}
                        {scenario.icon === "education" && <GraduationCap className={`w-5 h-5 ${scenario.color} shrink-0`} />}
                        {scenario.icon === "sparkles" && <Sparkles className={`w-5 h-5 ${scenario.color} shrink-0`} />}
                      </>
                    )}
                    <span className={`font-medium text-sm ${scenario.color}`}>{scenario.title}</span>
                    <span className={`${scenario.color}/50`}>|</span>
                    <span className={`text-sm ${scenario.color}`}>{scenario.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recording State */}
      {isRecording && (
        <div className="bg-primary/5 border border-primary/20 rounded-[3px] p-6">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Please read the following text in a quiet environment, record 10-30 seconds
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <p className="text-base text-foreground text-center leading-relaxed max-w-lg">
              {sampleText}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={generateRandomText}
              disabled={isRecording}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 20 + 10}px`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground ml-2">🎙️</span>
            </div>
            
            <div className="text-4xl font-bold text-primary">{countdown}S</div>
            <Button
              onClick={stopRecording}
              disabled={countdown > 20}
              className="min-w-[120px] bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white font-semibold"
            >
              Stop Recording
            </Button>
            {countdown > 20 && (
              <p className="text-xs text-muted-foreground">Can stop manually after 10 seconds</p>
            )}
          </div>
        </div>
      )}

      {/* Action buttons are now in SentenceTimeline */}

      {/* Upload mode - show simple player */}
      {originalAudioUrl && audioSource === "upload" && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Uploaded Audio</h3>
          <div className="relative group bg-gradient-to-br from-secondary via-secondary/80 to-secondary rounded-[3px] p-4 border border-border/50">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 h-8 text-muted-foreground">
                  {Array.from({ length: 15 }, (_, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-current opacity-40 rounded-full"
                      style={{ height: `${20 + Math.random() * 30}%` }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {originalFileName}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                onClick={deleteAudio}
              >
                <DeleteIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
          <div className="bg-card border border-border rounded-[3px] p-6 w-full max-w-lg shadow-elevated animate-scale-in mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Parameter Settings</h3>
                <p className="text-sm text-muted-foreground">
                  {isBatchEdit ? `Edit all ${sentences.length} sentences` : `Edit sentence ${editingSentenceId !== null ? editingSentenceId + 1 : ''}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => { setShowModal(false); setSelectedTags([]); setEditingSentenceId(null); setIsBatchEdit(false); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Show sentence text being edited */}
            {editingSentenceId !== null && (
              <div className="bg-secondary/50 rounded-[3px] p-3 mb-4">
                <p className="text-sm text-foreground">
                  {sentences.find(s => s.id === editingSentenceId)?.text}
                </p>
              </div>
            )}

            {/* Tags Section */}
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Emotion</p>
                <div className="flex flex-wrap gap-2">
                  {emotionTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-[3px] cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Style</p>
                <div className="flex flex-wrap gap-2">
                  {styleTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-[3px] cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Speed Control</p>
                <div className="flex flex-wrap gap-2">
                  {speedTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-[3px] cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowModal(false); setSelectedTags([]); setEditingSentenceId(null); setIsBatchEdit(false); }} className="font-semibold">
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={isGenerating} className="bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white font-semibold">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : isBatchEdit ? "Confirm Edit All" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VoiceEditTab;
