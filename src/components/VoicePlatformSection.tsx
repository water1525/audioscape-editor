import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    <section className="relative py-20 px-4 overflow-hidden" style={{ backgroundImage: `url(${voicePlatformBg})`, backgroundSize: 'cover', backgroundPosition: 'left bottom' }}>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          Explore More Possibilities with AI Voice
        </h2>
        <p className="text-white text-base md:text-lg">
          Leading models and tools driving industry transformation
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 border border-border/50 rounded-[3px] shadow-xl">
          {/* Top Tabs */}
          <div className="border-b border-border/30 bg-white/80">
            <div className="flex items-center">
              {tabs.map((tab, index) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex-1 group cursor-pointer"
                  >
                    <div className={`
                      flex items-center justify-center gap-2.5 py-4 px-4
                      transition-all duration-300
                      ${isActive 
                        ? 'text-foreground' 
                        : 'text-muted-foreground hover:text-foreground/80'
                      }
                    `}>
                      <IconComponent className={`
                        w-4 h-4 transition-all duration-300
                        ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground/60'}
                      `} />
                      <span className={`
                        text-sm tracking-wide transition-all duration-300
                        ${isActive ? 'font-medium' : 'font-normal'}
                      `}>
                        {tab.label}
                      </span>
                    </div>
                    
                    {/* Active indicator line */}
                    <div
                      className={`
                        absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full
                        transition-all duration-300 ease-out
                        ${isActive ? "w-10 bg-primary" : "w-0 bg-transparent"}
                      `}
                    />
                    
                    {/* Separator */}
                    {index < tabs.length - 1 && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-border/30" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8">{renderTabContent()}</div>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col items-center justify-center gap-4 mt-8 px-2">
          <p className="text-lg font-semibold text-white">
            Visit the Playground for full capabilities
          </p>
          <Link to="/playground">
            <Button className="px-6 py-2.5 h-auto text-base font-semibold bg-[hsl(221,100%,43%)] hover:bg-[hsl(221,100%,38%)] text-white shadow-lg shadow-[hsl(221,100%,43%)]/25 hover:shadow-xl hover:shadow-[hsl(221,100%,43%)]/30 transition-all duration-300">
              Try Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VoicePlatformSection;
