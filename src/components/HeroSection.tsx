import { useState, useEffect } from "react";
import heroBg from "@/assets/hero-bg.jpg";

// Banner data
const banners = [
  {
    id: 1,
    title: "Step-tts-2",
    subtitle: "Text to speech large model",
    tags: ["Hyper-realism", "Emotional mastery", "Instant cloning"],
  },
  {
    id: 2,
    title: "Step-Audio-EditX",
    subtitle: "Text to speech large model",
    tags: ["Hyper-realism", "Emotional mastery", "Instant cloning"],
  },
];

// Animated waveform component for hero section
const HeroWaveform = () => {
  const bars = 48;
  
  return (
    <div className="flex items-center justify-center gap-[3px] h-32">
      {[...Array(bars)].map((_, i) => {
        // Create a wave pattern - higher in the middle, lower at edges
        const distanceFromCenter = Math.abs(i - bars / 2);
        const baseHeight = Math.max(12, 80 - distanceFromCenter * 3);
        
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-[hsl(var(--hero-accent))] waveform-bar"
            style={{
              height: `${baseHeight}px`,
              animationDelay: `${i * 0.04}s`,
              boxShadow: '0 0 8px hsl(195 100% 50% / 0.7), 0 0 16px hsl(195 100% 50% / 0.4)',
            }}
          />
        );
      })}
    </div>
  );
};

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate banners every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentBanner = banners[activeIndex];

  return (
    <section className="hero-section relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,25%,8%)] via-[hsl(220,25%,8%)/0.7] to-transparent" />

      {/* Waveform Animation positioned in the circle area */}
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2 z-10 hidden md:block animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <HeroWaveform />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20">
        <div className="max-w-2xl">
          {/* Title */}
          <h1 
            key={currentBanner.id}
            className="hero-title text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 animate-fade-in"
          >
            {currentBanner.title}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-semibold text-[hsl(0,0%,100%)] mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {currentBanner.subtitle}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {currentBanner.tags.map((tag) => (
              <span key={tag} className="hero-tag">
                {tag}
              </span>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <button className="btn-hero-primary hover:opacity-90 transition-opacity duration-200">
              Use now
            </button>
            <button className="btn-hero-secondary hover:bg-[hsl(220,20%,15%)] transition-colors duration-200">
              Introduction
            </button>
          </div>
        </div>
      </div>

      {/* Banner indicators */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'w-8 bg-primary' 
                : 'w-4 bg-muted-foreground/40 hover:bg-muted-foreground/60'
            }`}
            aria-label={`切换到第${index + 1}个banner`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-[hsl(0,0%,40%)] flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-[hsl(0,0%,60%)] rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
