import { useState } from "react";
import { Button } from "@/components/ui/button";
import TextToSpeechTab from "@/components/TextToSpeechTab";
import VoiceCloneTab from "@/components/VoiceCloneTab";
import VoiceEditTab from "@/components/VoiceEditTab";

const tabs = [
  { id: "tts", label: "文本转语音" },
  { id: "clone", label: "语音复刻" },
  { id: "edit", label: "语音编辑" },
];

const Index = () => {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="text-center py-12 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
          构建AI应用强大的平台
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          领先的模型和工具助力行业变革
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-card border border-border rounded-2xl shadow-medium overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar Tabs */}
            <div className="md:w-[140px] p-4 md:border-r border-border bg-secondary/30 flex md:flex-col gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "tabActive" : "tab"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full justify-center md:justify-start text-sm transition-all duration-200"
                >
                  {tab.label}
                </Button>
              ))}
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
      </main>
    </div>
  );
};

export default Index;
