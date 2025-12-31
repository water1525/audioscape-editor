import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Play, Pause, RefreshCw, Trash2, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import WaveformAnimation from "@/components/ui/WaveformAnimation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCustomVoices } from "@/hooks/useCustomVoices";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCloneTabProps {
  onAudioGenerated?: (audioUrl: string, title: string) => void;
  onSaveVoiceReady?: (openSaveDialog: () => void) => void;
  onAudioDeleted?: () => void;
}

// Sample texts for recording (20-30 characters each)
const sampleTexts = [
  "Sunlight streams through the curtains, casting golden patterns on the floor.",
  "Technology advances rapidly, transforming our daily lives in countless ways.",
  "Music is a universal language that touches hearts across all cultures.",
  "Nature paints magnificent scenes with the changing of each season.",
  "The morning breeze gently brushes your cheek, carrying the fragrance of flowers.",
];

// AI generated target texts (20-30 characters each)
const aiTargetTexts = [
  "The morning dew glistens on petals, welcoming a brand new day.",
  "City lights twinkle in the night sky like countless distant stars.",
  "The aroma of coffee fills the air, awakening the sleeping soul.",
  "The sound of turning pages is the most beautiful melody of knowledge.",
  "Raindrops tap against the window, composing nature's own symphony.",
  "Children's laughter echoes through the park, pure and joyful.",
  "The sunset paints the sky in shades of orange, breathtakingly beautiful.",
  "Spring cherry blossoms fall like pink snow upon the winding path.",
];

const VoiceCloneTab = ({ onAudioGenerated, onSaveVoiceReady, onAudioDeleted }: VoiceCloneTabProps) => {
  // Custom voices hook
  const { saveVoice } = useCustomVoices();

  // Step 1: Recording state
  const [sampleText, setSampleText] = useState(sampleTexts[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioName, setRecordedAudioName] = useState<string>("");
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  
  // Step 2: Target text state
  const [targetText, setTargetText] = useState("");
  
  // Step 3: Clone state
  const [isCloning, setIsCloning] = useState(false);
  const [clonedAudioUrl, setClonedAudioUrl] = useState<string | null>(null);

  // Save voice dialog state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [voiceNameError, setVoiceNameError] = useState("");
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random sample text
  const generateRandomText = () => {
    const currentIndex = sampleTexts.indexOf(sampleText);
    let newIndex = Math.floor(Math.random() * sampleTexts.length);
    while (newIndex === currentIndex && sampleTexts.length > 1) {
      newIndex = Math.floor(Math.random() * sampleTexts.length);
    }
    setSampleText(sampleTexts[newIndex]);
  };

  // Generate AI target text
  const generateAITargetText = () => {
    const currentIndex = aiTargetTexts.indexOf(targetText);
    let newIndex = Math.floor(Math.random() * aiTargetTexts.length);
    while (newIndex === currentIndex && aiTargetTexts.length > 1) {
      newIndex = Math.floor(Math.random() * aiTargetTexts.length);
    }
    setTargetText(aiTargetTexts[newIndex]);
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
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        setRecordedAudioName(`${Date.now()}.wav`);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCountdown(10);

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      toast.success("Recording started. Please read the text.");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Cannot access microphone. Please check permissions.");
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

  // Delete recorded audio
  const deleteRecordedAudio = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    if (clonedAudioUrl) {
      URL.revokeObjectURL(clonedAudioUrl);
    }
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setRecordedAudioName("");
    setIsPlayingRecorded(false);
    setClonedAudioUrl(null);
    // Notify parent to hide the player bar
    onAudioDeleted?.();
  };

  // Play/pause recorded audio
  const togglePlayRecorded = () => {
    if (!recordedAudioUrl) return;

    if (!recordedAudioRef.current) {
      recordedAudioRef.current = new Audio(recordedAudioUrl);
      recordedAudioRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      recordedAudioRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      recordedAudioRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  // Clone voice using Step TTS Mini
  const cloneVoice = async () => {
    if (!recordedAudio || !targetText.trim()) {
      toast.error("Please record audio and enter target text first");
      return;
    }

    setIsCloning(true);
    try {
      // Convert recorded audio blob to base64
      const arrayBuffer = await recordedAudio.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const audioBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("clone-voice", {
        body: {
          audioBase64,
          sampleText, // The text that was spoken during recording
          targetText, // The text to generate with the cloned voice
        },
      });

      if (error) {
        throw new Error((error as any)?.message || "Voice cloning failed");
      }

      // New function response: { audioBase64 }
      if (data && typeof data === "object" && "audioBase64" in (data as any)) {
        const audioBlob = base64ToBlob(String((data as any).audioBase64), "audio/mpeg");
        const url = URL.createObjectURL(audioBlob);
        setClonedAudioUrl(url);
        toast.success("Voice cloned successfully! Audio generated with your voice.");

        // Notify parent component to play in bottom bar
        onAudioGenerated?.(url, "Cloned Audio");
        return;
      }

      // Fallback (older response)
      const audioBlob = data instanceof Blob ? data : new Blob([data as any], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBlob);
      setClonedAudioUrl(url);
      toast.success("Voice cloned successfully! Audio generated with your voice.");

      // Notify parent component to play in bottom bar
      onAudioGenerated?.(url, "Cloned Audio");
    } catch (error) {
      console.error("Voice cloning error:", error);
      toast.error(error instanceof Error ? error.message : "Voice cloning failed. Please try again.");
    } finally {
      setIsCloning(false);
    }
  };

  // Base64 to Blob helper (kept for potential future use)
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Open save dialog
  const openSaveDialog = () => {
    setVoiceName("");
    setVoiceNameError("");
    setIsSaveDialogOpen(true);
  };

  // Validate and save voice
  const handleSaveVoice = () => {
    const trimmedName = voiceName.trim();
    
    if (trimmedName.length < 1) {
      setVoiceNameError("Voice name must be at least 1 character");
      return;
    }
    
    if (trimmedName.length > 20) {
      setVoiceNameError("Voice name cannot exceed 20 characters");
      return;
    }

    saveVoice(trimmedName);
    setIsSaveDialogOpen(false);
    setVoiceName("");
    toast.success(`Voice "${trimmedName}" saved successfully!`);
  };

  // Auto stop when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && isRecording) {
      stopRecording();
    }
  }, [countdown, isRecording, stopRecording]);

  // Expose openSaveDialog to parent when cloned audio is ready
  useEffect(() => {
    if (clonedAudioUrl && onSaveVoiceReady) {
      onSaveVoiceReady(openSaveDialog);
    }
  }, [clonedAudioUrl, onSaveVoiceReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (clonedAudioUrl) {
        URL.revokeObjectURL(clonedAudioUrl);
      }
    };
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Step 1: Record Audio */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Step 1: Record Audio</h3>
        
        {!recordedAudioUrl ? (
          <div className="bg-primary/5 border border-primary/20 rounded-[3px] p-6">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Please read the following text in a quiet environment, recording 5-10 seconds
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

            {isRecording ? (
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-bold text-primary">{countdown}S</div>
                <Button
                  onClick={stopRecording}
                  disabled={countdown > 5}
                  className="min-w-[120px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md"
                >
                  Stop Recording
                </Button>
                {countdown > 5 && (
                  <p className="text-xs text-muted-foreground">Can stop manually after 5 seconds</p>
                )}
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={startRecording} className="min-w-[120px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md">
                  Start Recording
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[3px] p-4">
            <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-[3px] bg-primary/10"
                onClick={togglePlayRecorded}
              >
                {isPlayingRecorded ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              {isPlayingRecorded && (
                <WaveformAnimation isPlaying={true} variant="small" barCount={4} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {recordedAudioName}
                </p>
                <p className="text-xs text-muted-foreground">00:10</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={deleteRecordedAudio}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Target Text */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Step 2: Enter Target Text</h3>
        <div className="relative">
          <Textarea
            placeholder="Enter the text you want to generate audio for"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value.slice(0, 1000))}
            className="min-h-[120px] resize-none pr-16"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={generateAITargetText}
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">AI</span>
              {aiTargetTexts.includes(targetText) && (
                <RefreshCw className="h-3 w-3 ml-0.5" />
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              {targetText.length}/1000 chars
            </span>
          </div>
        </div>
      </div>

      {/* Clone Button */}
      {recordedAudioUrl && targetText.trim() && (
        <div className="flex justify-center">
          <Button
            onClick={cloneVoice}
            disabled={isCloning}
            className="min-w-[120px] bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md"
          >
            {isCloning ? "Cloning..." : "Clone Voice"}
          </Button>
        </div>
      )}


      {/* Save Voice Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Voice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Voice Name
              </label>
              <Input
                placeholder="Enter voice name (1-20 characters)"
                value={voiceName}
                onChange={(e) => {
                  setVoiceName(e.target.value);
                  setVoiceNameError("");
                }}
                maxLength={20}
              />
              {voiceNameError && (
                <p className="text-sm text-destructive">{voiceNameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {voiceName.length}/20 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} className="font-semibold">
              Cancel
            </Button>
            <Button onClick={handleSaveVoice} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold shadow-md">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceCloneTab;
