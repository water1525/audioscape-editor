import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import VoicePlatformSection from "@/components/VoicePlatformSection";
import PlaygroundCTASection from "@/components/PlaygroundCTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <VoicePlatformSection />
      <PlaygroundCTASection />
    </div>
  );
};

export default Index;
