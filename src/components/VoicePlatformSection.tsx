import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareText, Mic2, Wand2 } from "lucide-react";
import TextToSpeechTab from "@/components/TextToSpeechTab";
import VoiceCloneTab from "@/components/VoiceCloneTab";
import VoiceEditTab from "@/components/VoiceEditTab";

const tabs = [
  { id: "tts", label: "文本转语音", icon: MessageSquareText },
  { id: "clone", label: "语音复刻", icon: Mic2 },
  { id: "edit", label: "语音编辑", icon: Wand2 },
];

const VoicePlatformSection = () => {
  const [activeTab, setActiveTab] = useState("tts");

  const renderTabContent = () => {
    switch (activeTab) {
      case "tts":
        return <TextToSpeechTab />;
      case "clone":
        return <VoiceCloneTab />;
      case "edit":
        return <VoiceEditTab />;
      default:
        return <TextToSpeechTab />;
    }
  };

  return (
    <section className="bg-background py-20 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
          构建AI应用强大的平台
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          领先的模型和工具助力行业变革
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar Tabs */}
            <div className="md:w-[140px] p-2 md:border-r border-border/30 bg-gradient-to-b from-secondary/40 to-secondary/20 flex md:flex-col gap-1.5">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "tabActive" : "tab"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full justify-center gap-2 text-xs px-2.5 py-2 h-auto transition-all duration-300 ${
                      activeTab === tab.id 
                        ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_12px_rgba(59,130,246,0.3)]" 
                        : "hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 text-muted-foreground" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8">{renderTabContent()}</div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between mt-8 px-2">
          <p className="text-sm text-muted-foreground">
            前往体验中心体验完整能力
          </p>
          <Button variant="outline" size="sm">
            立即体验
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VoicePlatformSection;
