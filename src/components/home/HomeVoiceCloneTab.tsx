import { Button } from "@/components/ui/button";
import { Upload, Mic } from "lucide-react";

const HomeVoiceCloneTab = () => {
  return (
    <div className="animate-fade-in">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-8">
        <div className="flex flex-col items-center gap-4">
          {/* Stylized Microphone Icon */}
          <div className="relative">
            <svg 
              width="80" 
              height="60" 
              viewBox="0 0 80 60" 
              fill="none"
              className="text-primary"
            >
              {/* Microphone body */}
              <rect x="30" y="8" width="20" height="32" rx="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
              {/* Microphone stand */}
              <path d="M22 32 C22 45, 40 52, 40 52 C40 52, 58 45, 58 32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <line x1="40" y1="52" x2="40" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="32" y1="58" x2="48" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              {/* Sound waves */}
              <path d="M62 20 C65 24, 65 32, 62 36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
              <path d="M68 16 C73 22, 73 34, 68 40" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
            </svg>
            {/* Clone icon */}
            <div className="absolute -top-1 -right-2">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none"
                className="text-primary"
              >
                <path 
                  d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="hsl(var(--primary) / 0.1)"
                />
                <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="hsl(var(--primary) / 0.1)" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              请选择音频文件，可直接录制
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              支持mp3/wav格式，限制时长5-10S
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="outline"
              className="gap-2"
              disabled
            >
              <Upload className="h-4 w-4" />
              上传音频
            </Button>
            <Button
              className="gap-2"
              disabled
            >
              <Mic className="h-4 w-4" />
              开始录制
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeVoiceCloneTab;
