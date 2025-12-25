import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, ArrowRight, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emotionTags = [
  "电台", "纪录", "亲密", "稳健", "大气", "沉稳", "月亮", "阳光", "磁性",
];
const styleTags = [
  "严厉", "抒情", "共鸣", "清亮", "质朴", "孝庄", "快速",
];
const ageTags = ["严肃", "膨胀", "儿童", "平静", "可等", "呼呼", "吹嘘", "请谅"];
const otherTags = [
  "迷人", "法语", "风雨", "浏河", "法语", "中老年", "特别女",
];

const ORIGINAL_TEXT = "在遥远的星际中，星星人踏上了一段奇妙的冒险旅程。他们穿越星云，探索未知的宇宙奥秘。";
const EDITED_TEXT = "星星人勇敢地面对宇宙中的挑战，他们的冒险故事激励着每一个仰望星空的人。";

const VoiceEditTab = () => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Audio states
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [editedAudioUrl, setEditedAudioUrl] = useState<string | null>(null);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [isPlayingEdited, setIsPlayingEdited] = useState(false);
  
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const editedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate original audio on mount
  useEffect(() => {
    generateOriginalAudio();
  }, []);

  const generateOriginalAudio = async () => {
    setIsLoadingOriginal(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/step-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: ORIGINAL_TEXT,
            voice: "cixingnansheng",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setOriginalAudioUrl(audioUrl);
    } catch (error) {
      console.error("Error generating original audio:", error);
      toast({
        title: "音频生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOriginal(false);
    }
  };

  const handleEdit = () => {
    setShowModal(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleConfirm = async () => {
    if (selectedTags.length === 0) {
      setShowModal(false);
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/step-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: EDITED_TEXT,
            voice: "tianmeinvsheng",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate edited audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setEditedAudioUrl(audioUrl);
      setIsEdited(true);
      setShowModal(false);
      setSelectedTags([]);
      
      toast({
        title: "音频生成成功",
        description: `已应用 ${selectedTags.length} 个风格标签`,
      });
    } catch (error) {
      console.error("Error generating edited audio:", error);
      toast({
        title: "音频生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayOriginal = () => {
    if (!originalAudioRef.current || !originalAudioUrl) return;
    
    if (isPlayingOriginal) {
      originalAudioRef.current.pause();
    } else {
      // Pause edited if playing
      if (editedAudioRef.current && isPlayingEdited) {
        editedAudioRef.current.pause();
        setIsPlayingEdited(false);
      }
      originalAudioRef.current.play();
    }
    setIsPlayingOriginal(!isPlayingOriginal);
  };

  const togglePlayEdited = () => {
    if (!editedAudioRef.current || !editedAudioUrl) return;
    
    if (isPlayingEdited) {
      editedAudioRef.current.pause();
    } else {
      // Pause original if playing
      if (originalAudioRef.current && isPlayingOriginal) {
        originalAudioRef.current.pause();
        setIsPlayingOriginal(false);
      }
      editedAudioRef.current.play();
    }
    setIsPlayingEdited(!isPlayingEdited);
  };

  return (
    <div className="animate-fade-in">
      {/* Hidden audio elements */}
      {originalAudioUrl && (
        <audio
          ref={originalAudioRef}
          src={originalAudioUrl}
          onEnded={() => setIsPlayingOriginal(false)}
        />
      )}
      {editedAudioUrl && (
        <audio
          ref={editedAudioRef}
          src={editedAudioUrl}
          onEnded={() => setIsPlayingEdited(false)}
        />
      )}

      {/* Original Audio Section */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-3">原始音频</p>
        <div className="bg-card border border-border rounded-lg p-4 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="play" 
              size="iconSm"
              onClick={togglePlayOriginal}
              disabled={isLoadingOriginal || !originalAudioUrl}
            >
              {isLoadingOriginal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlayingOriginal ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div>
              <p className="text-sm font-medium text-foreground">
                星星人冒险.wav
              </p>
              <p className="text-xs text-muted-foreground">00:10</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="gap-2"
          >
            <ArrowRight className="h-3 w-3" />
            编辑
          </Button>
        </div>
      </div>

      {/* Edited Audio Section */}
      {isEdited && (
        <div className="mb-4 animate-slide-up">
          <p className="text-sm text-muted-foreground mb-3">编辑后的音频</p>
          <div className="bg-accent border border-primary/30 rounded-lg p-4 shadow-soft flex items-center gap-3">
            <Button 
              variant="play" 
              size="iconSm"
              onClick={togglePlayEdited}
              disabled={!editedAudioUrl}
            >
              {isPlayingEdited ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div>
              <p className="text-sm font-medium text-foreground">
                星星人冒险_edited.wav
              </p>
              <p className="text-xs text-muted-foreground">00:10</p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">@Step-tts-edit</span>{" "}
        编辑原音频的情绪、风格、速度
      </p>

      {/* Edit Modal - Using Portal to prevent clipping */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-elevated animate-scale-in mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  参数设置
                </h3>
                <p className="text-xs text-muted-foreground">
                  通配只影响风格标识符，请尽量下载任意风格
                </p>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setShowModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tags Section */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">干练</p>
                <div className="flex flex-wrap gap-2">
                  {emotionTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">风格</p>
                <div className="flex flex-wrap gap-2">
                  {styleTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">更多</p>
                <div className="flex flex-wrap gap-2">
                  {ageTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  常用标签
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherTags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                已选择 {selectedTags.length} 个标签
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => { setShowModal(false); setSelectedTags([]); }}>
                  取消
                </Button>
                <Button onClick={handleConfirm} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      生成中...
                    </>
                  ) : "确认"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VoiceEditTab;
