import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const cases = [
  {
    id: "case1",
    label: "case1",
    text: "智能阶跃，十倍每个人的可能。我们致力于打造最先进的人工智能技术，让每一个人都能享受到AI带来的便利。",
  },
  {
    id: "case2",
    label: "case2",
    text: "这是第二个示例文本。您可以在这里输入任何想要转换成语音的内容。语音合成技术让文字变得生动有趣。",
  },
  {
    id: "case3",
    label: "case3",
    text: "欢迎使用AI语音平台。我们提供最先进的语音合成技术，支持多种音色和情感表达。",
  },
];

const TextToSpeechTab = () => {
  const [activeCase, setActiveCase] = useState("case1");
  const [isPlaying, setIsPlaying] = useState(false);
  const currentCase = cases.find((c) => c.id === activeCase) || cases[0];

  const handlePlay = async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      console.log('Supabase URL:', supabaseUrl);
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/step-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            text: currentCase.text,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to generate speech";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response is not JSON
        }
        throw new Error(errorMessage);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast.error("音频播放失败");
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      toast.error(error instanceof Error ? error.message : "语音合成失败");
      setIsPlaying(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Text Display Area */}
      <div className="bg-card border border-border rounded-lg p-6 mb-4 min-h-[160px] shadow-soft">
        <pre className="text-foreground font-mono text-sm whitespace-pre-wrap leading-relaxed">
          {currentCase.text}
        </pre>
      </div>

      {/* Case Selector */}
      <div className="flex items-center gap-2 mb-6">
        {cases.map((caseItem) => (
          <Button
            key={caseItem.id}
            variant={activeCase === caseItem.id ? "caseActive" : "case"}
            size="sm"
            onClick={() => setActiveCase(caseItem.id)}
            className="min-w-[70px] transition-all duration-200"
          >
            {caseItem.label}
          </Button>
        ))}
      </div>

      {/* Description and Play */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">@step-tts-2</span>{" "}
          生成效具有人感、拥有丰富情绪、风格的语音
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handlePlay}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {isPlaying ? "播放中..." : "播放"}
        </Button>
      </div>
    </div>
  );
};

export default TextToSpeechTab;
