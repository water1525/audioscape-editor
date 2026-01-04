import { cn } from "@/lib/utils";

interface WaveformAnimationProps {
  isPlaying: boolean;
  variant?: "default" | "primary" | "small";
  barCount?: number;
  className?: string;
}

const WaveformAnimation = ({ 
  isPlaying, 
  variant = "default", 
  barCount = 5,
  className 
}: WaveformAnimationProps) => {
  const colorClass = variant === "primary" 
    ? "bg-primary" 
    : variant === "small"
    ? "bg-primary"
    : "bg-muted-foreground/60";
  
  const heightClass = variant === "small" ? "h-4" : "h-6";
  const barWidth = variant === "small" ? "w-[2px]" : "w-[3px]";
  const gap = variant === "small" ? "gap-[2px]" : "gap-[3px]";

  if (!isPlaying) {
    return (
      <div className={cn(`flex items-center ${gap} ${heightClass}`, className)}>
        {[...Array(barCount)].map((_, i) => (
          <div
            key={i}
            className={cn(`${barWidth} ${colorClass} opacity-40`)}
            style={{ height: `${30 + (i % 3) * 20}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(`flex items-center ${gap} ${heightClass}`, className)}>
      {[...Array(barCount)].map((_, i) => (
        <div
          key={i}
          className={cn(
            `${barWidth} ${colorClass} animate-waveform`,
            "origin-center"
          )}
          style={{ 
            animationDelay: `${i * 0.1}s`,
            height: "100%"
          }}
        />
      ))}
    </div>
  );
};

export default WaveformAnimation;
