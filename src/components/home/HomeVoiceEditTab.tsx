import { Button } from "@/components/ui/button";
import { Upload, Mic } from "lucide-react";

const HomeVoiceEditTab = () => {
  return (
    <div className="animate-fade-in">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-8">
        <div className="flex flex-col items-center gap-4">
          {/* Stylized Waveform + Edit Icon Design */}
          <div className="relative">
            <svg 
              width="80" 
              height="60" 
              viewBox="0 0 80 60" 
              fill="none"
              className="text-primary"
            >
              {/* Waveform pattern */}
              <path 
                d="M5 30 L10 30 L15 20 L20 40 L25 15 L30 45 L35 10 L40 50 L45 5 L50 55 L55 20 L60 35 L65 25 L70 30 L75 30" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            {/* Edit pencil icon */}
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

export default HomeVoiceEditTab;
