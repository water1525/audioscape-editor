import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, Upload, Mic, RefreshCw, Trash2, X, Loader2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Headphones, MessageSquare, Megaphone, GraduationCap, Radio, Newspaper } from "lucide-react";

// Sample texts for recording (~50 characters each, 10-30s reading time)
const sampleTexts = [
  "In this rapidly evolving era, technology has transformed our way of life, enabling us to communicate and interact with people around the world more conveniently.",
  "The warm spring sunshine brightens the day as flowers bloom and birds sing on the branches, everything appears full of vitality in this season of renewal.",
  "Artificial intelligence technology is profoundly changing various industries, from medical diagnosis to autonomous driving, its applications are becoming increasingly widespread.",
  "The city lights shine brilliantly at night, warm light emanates from the windows of tall buildings, while traffic flows through the streets as people hurry to their destinations.",
  "Music is a universal language that transcends cultural and geographical boundaries, touching the softest part of everyone's heart and bringing endless emotion and resonance.",
];

// Preset scenarios for quick generation
const presetScenarios = [
  { id: "news", icon: Newspaper, title: "News Broadcast", subtitle: "Step 3 Release", color: "text-emerald-500", bgColor: "bg-emerald-50", text: "Breaking news: Step 3 voice model is officially released, supporting natural speech synthesis with various emotional styles, bringing users a more realistic voice experience." },
  { id: "audiobook", icon: Headphones, title: "Audiobook", subtitle: "Mystery Story", color: "text-purple-500", bgColor: "bg-purple-50", text: "On that rainy night, he walked alone on the empty street. Suddenly, a flash of lightning split the night sky, and he saw a mysterious figure standing at the corner." },
  { id: "service", icon: MessageSquare, title: "Customer Service", subtitle: "AI Assistant", color: "text-orange-500", bgColor: "bg-orange-50", text: "Hello, welcome to our Customer Service Center. I am your intelligent customer service assistant. How may I help you today?" },
  { id: "ad", icon: Megaphone, title: "Ad Voiceover", subtitle: "Brand Promo", color: "text-pink-500", bgColor: "bg-pink-50", text: "Explore infinite possibilities, create a brilliant future. We use technology to change lives and innovation to define tomorrow." },
  { id: "education", icon: GraduationCap, title: "Education", subtitle: "Poetry Reading", color: "text-blue-500", bgColor: "bg-blue-50", text: "Before my bed, the moonlight gleams, like frost upon the ground it seems. I raise my head to watch the moon, then lower it, thinking of home." },
  { id: "radio", icon: Radio, title: "Emotional Radio", subtitle: "Night Healing", color: "text-red-500", bgColor: "bg-red-50", text: "On this quiet night, let us slow down together and listen to the voice within. May you have sweet dreams tonight and still be filled with hope tomorrow." },
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
      toast.error("请至少选择一个编辑参数");
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
                  className="gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md"
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
            <div className="grid grid-cols-2 gap-3">
              {presetScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handlePresetClick(scenario)}
                  disabled={isGeneratingPreset !== null}
                  className={`flex items-center gap-3 p-3 rounded-[3px] border border-border/50 bg-background hover:bg-secondary/50 transition-all text-left ${
                    isGeneratingPreset === scenario.id ? "opacity-70" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-[3px] ${scenario.bgColor} flex items-center justify-center shrink-0`}>
                    {isGeneratingPreset === scenario.id ? (
                      <Loader2 className={`h-5 w-5 ${scenario.color} animate-spin`} />
                    ) : (
                      <scenario.icon className={`h-5 w-5 ${scenario.color}`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{scenario.title}</span>
                      <span className="text-muted-foreground text-xs">|</span>
                      <span className="text-muted-foreground text-xs truncate">{scenario.subtitle}</span>
                    </div>
                  </div>
                </button>
              ))}
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
              className="min-w-[120px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md"
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
                <Trash2 className="h-4 w-4" />
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
              <Button onClick={handleConfirm} disabled={isGenerating} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md">
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
