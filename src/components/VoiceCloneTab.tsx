import { Button } from "@/components/ui/button";
import { Play, User } from "lucide-react";

const voiceProfiles = [
  {
    id: "cila",
    name: "头像",
    gender: "♀",
    original: "cila原声",
    cloned: "cila声音复刻",
  },
  {
    id: "john",
    name: "头像",
    gender: "♂",
    original: "john原声",
    cloned: "john声音变换",
  },
];

const VoiceCloneTab = () => {
  return (
    <div className="animate-fade-in">
      {/* Voice Profiles Grid */}
      <div className="flex items-start gap-6 mb-6">
        {voiceProfiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-card border border-border rounded-lg p-4 shadow-soft hover:shadow-medium transition-shadow duration-200"
          >
            {/* Avatar */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                {profile.name}
              </span>
              <span className="text-xs text-primary">{profile.gender}</span>
            </div>

            {/* Voice Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="play"
                size="sm"
                className="justify-start gap-2 text-xs"
              >
                <Play className="h-3 w-3" />
                {profile.original}
              </Button>
              <Button
                variant="play"
                size="sm"
                className="justify-start gap-2 text-xs"
              >
                <Play className="h-3 w-3" />
                {profile.cloned}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@step-tts-2</span>{" "}
        生成与原声音一模一样的语音复刻品
      </p>
    </div>
  );
};

export default VoiceCloneTab;
