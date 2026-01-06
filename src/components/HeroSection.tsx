import { useState, useEffect } from "react";
import heroBg from "@/assets/hero-bg.png";

// Banner data
const banners = [{
  id: 1,
  title: "Step-tts-2",
  subtitle: "Realistic Voice Synthesis",
  tags: ["Hyper-realism", "Emotional mastery", "Instant cloning"],
  animation: "waveform"
}, {
  id: 2,
  title: "Step-Audio-EditX",
  subtitle: "Intelligent Audio Editing",
  tags: ["Hyper-realism", "Emotional mastery", "Instant cloning"],
  animation: "spectrum"
}];

// Animated waveform component for Step-tts-2
const HeroWaveform = () => {
  const bars = 48;
  return <div className="flex items-center justify-center gap-[3px] h-32">
      {[...Array(bars)].map((_, i) => {
      const distanceFromCenter = Math.abs(i - bars / 2);
      const baseHeight = Math.max(12, 80 - distanceFromCenter * 3);
      return <div key={i} className="w-[3px] rounded-full bg-[hsl(var(--hero-accent))] waveform-bar" style={{
        height: `${baseHeight}px`,
        animationDelay: `${i * 0.04}s`
      }} />;
    })}
    </div>;
};

// Floating particles animation for Step-Audio-EditX
const HeroParticles = () => {
  const particles = 16;
  return <div className="relative w-48 h-32 flex items-center justify-center">
      {[...Array(particles)].map((_, i) => {
      const angle = i / particles * Math.PI * 2;
      const radius = 40 + Math.random() * 20;
      const size = 4 + Math.random() * 6;
      const delay = i * 0.15;
      return <div key={i} className="absolute bg-[hsl(var(--hero-accent))] rounded-full" style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `calc(50% + ${Math.cos(angle) * radius}px)`,
        top: `calc(50% + ${Math.sin(angle) * radius}px)`,
        animation: `particle-float 2s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }} />;
    })}
      {/* Center glow */}
      <div className="absolute w-8 h-8 bg-[hsl(var(--hero-accent))/0.3] rounded-full blur-lg" style={{
      animation: 'pulse-glow 1.5s ease-in-out infinite'
    }} />
    </div>;
};
const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeButton, setActiveButton] = useState<'use' | 'intro'>('use');

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const currentBanner = banners[activeIndex];
  return <section className="hero-section relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundPosition: "70% center"
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,25%,8%)] via-[hsl(220,25%,8%)/0.7] to-transparent" />


      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20">
        <div className="max-w-2xl">
          {/* Title */}
          <h1 key={currentBanner.id} className="hero-title text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 animate-fade-in">
            {currentBanner.title}
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle text-3xl md:text-4xl mb-6 animate-fade-in" style={{
          animationDelay: "0.1s"
        }}>
            {currentBanner.subtitle}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-16 animate-fade-in" style={{
          animationDelay: "0.2s"
        }}>
            {currentBanner.tags.map(tag => <span key={tag} className="hero-tag">
                {tag}
              </span>)}
          </div>

          {/* Buttons - Toggle style */}
          <div className="inline-flex rounded-[3px] overflow-hidden animate-fade-in" style={{
          animationDelay: "0.3s"
        }}>
            <button 
              onClick={() => setActiveButton('use')}
              className={`px-10 py-4 text-lg transition-colors duration-200 ${
                activeButton === 'use' 
                  ? 'bg-[#AD0606] text-white font-semibold' 
                  : 'bg-white text-foreground hover:bg-gray-100'
              }`}
            >
              Use now
            </button>
            <button 
              onClick={() => setActiveButton('intro')}
              className={`px-10 py-4 text-lg transition-colors duration-200 ${
                activeButton === 'intro' 
                  ? 'bg-[#AD0606] text-white font-semibold' 
                  : 'bg-white text-foreground hover:bg-gray-100'
              }`}
            >
              Introduction
            </button>
          </div>
        </div>
      </div>

      {/* Banner indicators - moved to left side */}
      <div className="absolute bottom-20 left-6 md:left-12 lg:left-20 flex items-center gap-2 z-20">
        {banners.map((_, index) => <button key={index} onClick={() => setActiveIndex(index)} className={`h-1 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-8 bg-primary' : 'w-4 bg-muted-foreground/40 hover:bg-muted-foreground/60'}`} aria-label={`Switch to banner ${index + 1}`} />)}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-[hsl(0,0%,40%)] flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-[hsl(0,0%,60%)] rounded-full" />
        </div>
      </div>

      {/* Particle animation keyframes */}
      <style>{`
        @keyframes particle-float {
          0%, 100% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.6; transform: translateY(-8px) scale(1.2); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
      `}</style>
    </section>;
};
export default HeroSection;