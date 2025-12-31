import { useState } from "react";
import { MessageSquareText, Mic2, Wand2 } from "lucide-react";
import TextToSpeechTab from "@/components/TextToSpeechTab";
import HomeVoiceCloneTab from "@/components/home/HomeVoiceCloneTab";
import HomeVoiceEditTab from "@/components/home/HomeVoiceEditTab";
import voicePlatformBg from "@/assets/voice-platform-bg.png";

const tabs = [
  { id: "tts", label: "Text to Speech", icon: MessageSquareText },
  { id: "clone", label: "Voice Clone", icon: Mic2 },
  { id: "edit", label: "Voice Edit", icon: Wand2 },
];

const VoicePlatformSection = () => {
  const [activeTab, setActiveTab] = useState("tts");

  const renderTabContent = () => {
    switch (activeTab) {
      case "tts":
        return <TextToSpeechTab />;
      case "clone":
        return <HomeVoiceCloneTab />;
      case "edit":
        return <HomeVoiceEditTab key="home-voice-edit" />;
      default:
        return <TextToSpeechTab />;
    }
  };

  return (
    <section className="relative min-h-screen px-4 pt-20 pb-0 overflow-hidden" style={{ backgroundImage: `url(${voicePlatformBg})`, backgroundSize: 'cover', backgroundPosition: 'left bottom' }}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-medium text-white mb-3 tracking-tight" style={{ fontFamily: 'HFTerse, sans-serif' }}>
          Explore More Possibilities with AI Voice
        </h2>
        <p className="text-white text-base md:text-lg">
          Leading models and tools driving industry transformation
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="bg-white/80 rounded-t-[3px] shadow-xl flex-1 flex flex-col">
          {/* Top Tabs */}
          <div className="bg-white rounded-t-[3px]">
            <div className="flex items-center">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex-1 cursor-pointer transition-all duration-300
                      ${isActive 
                        ? 'bg-[#C23A2B]' 
                        : 'bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className={`
                      flex items-center justify-center gap-2.5 py-4 px-4
                      transition-all duration-300
                      ${isActive 
                        ? 'text-white' 
                        : 'text-foreground'
                      }
                    `}>
                      <IconComponent className={`
                        w-4 h-4 transition-all duration-300
                        ${isActive ? 'text-white' : 'text-muted-foreground'}
                      `} />
                      <span className="text-sm font-semibold tracking-wide transition-all duration-300">
                        {tab.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8 flex-1">{renderTabContent()}</div>
        </div>
      </div>
    </section>
  );
};

export default VoicePlatformSection;
