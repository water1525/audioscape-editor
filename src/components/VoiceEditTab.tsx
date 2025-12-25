import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, X } from "lucide-react";

const emotionTags = [
  "电台",
  "纪录",
  "亲密",
  "稳健",
  "大气",
  "沉稳",
  "月亮",
  "阳光",
  "磁性",
];
const styleTags = [
  "严厉",
  "抒情",
  "共鸣",
  "清亮",
  "质朴",
  "孝庄",
  "快速",
];
const ageTags = ["严肃", "膨胀", "儿童", "平静", "可等", "呼呼", "吹嘘", "请谅"];
const otherTags = [
  "迷人",
  "法语",
  "风雨",
  "浏河",
  "法语",
  "中老年",
  "特别女",
];

const VoiceEditTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setIsEdited(true);
    setShowModal(false);
    setSelectedTags([]);
  };

  return (
    <div className="animate-fade-in">
      {/* Original Audio Section */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-3">原始音频</p>
        <div className="bg-card border border-border rounded-lg p-4 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="play" size="iconSm">
              <Play className="h-4 w-4" />
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
            <Button variant="play" size="iconSm">
              <Play className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm font-medium text-foreground">
                星星人冒险.wav
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

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-elevated animate-scale-in">
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
                  {isGenerating ? "生成中..." : "确认"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceEditTab;
