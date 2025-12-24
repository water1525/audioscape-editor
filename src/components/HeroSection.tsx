import heroBg from "@/assets/hero-bg.jpg";

const tags = ["Hyper-realism", "Emotional mastery", "Instant cloning"];

const HeroSection = () => {
  return (
    <section className="hero-section relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,25%,8%)] via-[hsl(220,25%,8%)/0.7] to-transparent" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20">
        <div className="max-w-2xl">
          {/* Title */}
          <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 animate-fade-in">
            step-tts-2
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl font-semibold text-[hsl(0,0%,100%)] mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Text to speech large model
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {tags.map((tag) => (
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
