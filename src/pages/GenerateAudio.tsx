import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://vixczylcdviqivlziovw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpeGN6eWxjZHZpcWl2bHppb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzQ0NzAsImV4cCI6MjA4MjE1MDQ3MH0.XKpCSVe3ctAZgjfh90W_x6mdA-lqcJRHUndy4LXROkg";

const audioConfigs = [
  {
    id: "cila-original",
    filename: "cila-original.mp3",
    text: "大家好，我是Cila，很高兴认识你。今天天气真不错，希望你有愉快的一天！",
    voice: "tianmeinvsheng",
  },
  {
    id: "cila-cloned",
    filename: "cila-cloned.mp3",
    text: "欢迎使用阶跃星辰语音合成平台，我是Cila，这是通过AI技术复刻我声音生成的语音。",
    voice: "tianmeinvsheng",
  },
  {
    id: "john-original",
    filename: "john-original.mp3",
    text: "你好，我是John，欢迎来到我们的语音平台。让我为你展示一下语音合成的魅力。",
    voice: "cixingnansheng",
  },
  {
    id: "john-cloned",
    filename: "john-cloned.mp3",
    text: "你好，这是通过Step-tts-2模型复刻我的声音生成的语音，听起来和原声一样自然。",
    voice: "cixingnansheng",
  },
];

const GenerateAudio = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const generateAndDownload = async (config: typeof audioConfigs[0]) => {
    setLoading((prev) => ({ ...prev, [config.id]: true }));

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/step-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ text: config.text, voice: config.voice }),
      });

      if (!response.ok) {
        throw new Error("生成失败");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Download the file
      const a = document.createElement("a");
      a.href = url;
      a.download = config.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCompleted((prev) => ({ ...prev, [config.id]: true }));
      toast.success(`${config.filename} 下载成功`);
    } catch (error) {
      toast.error(`生成 ${config.filename} 失败`);
    } finally {
      setLoading((prev) => ({ ...prev, [config.id]: false }));
    }
  };

  const generateAll = async () => {
    for (const config of audioConfigs) {
      await generateAndDownload(config);
      // Wait between requests to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1500));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">生成音频文件</h1>
        <p className="text-muted-foreground mb-6">
          生成并下载音频文件，然后将它们放到 <code className="bg-muted px-2 py-1 rounded">public/audio/</code> 目录
        </p>

        <div className="space-y-4 mb-8">
          {audioConfigs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
            >
              <div>
                <p className="font-medium text-foreground">{config.filename}</p>
                <p className="text-sm text-muted-foreground truncate max-w-md">{config.text}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateAndDownload(config)}
                disabled={loading[config.id]}
              >
                {loading[config.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : completed[config.id] ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={generateAll} className="w-full">
          生成全部并下载
        </Button>

        <p className="text-sm text-muted-foreground mt-4">
          下载完成后，将文件放到项目的 public/audio/ 目录即可实现即点即播。
        </p>
      </div>
    </div>
  );
};

export default GenerateAudio;
