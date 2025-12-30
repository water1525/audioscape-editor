# 阶跃星辰开放平台 - 首页需求文档

## 一、页面概述

首页是阶跃星辰AI语音开放平台的主入口，展示核心产品能力并提供交互式体验。

**页面路径**：`/`

---

## 二、页面结构

### 1. 导航栏 (Navbar)

**位置**：页面顶部，固定透明背景

| 元素 | 说明 |
|------|------|
| Logo | "阶跃星辰 \| 开放平台" |
| 导航链接 | 首页、文档中心、体验中心（带下拉箭头）、繁星计划、阶跃星辰官网 |
| 用户入口 | 用户中心（带下拉箭头） |

**组件文件**：`src/components/Navbar.tsx`

---

### 2. Hero区域 (HeroSection)

**位置**：首屏全屏展示

**组件文件**：`src/components/HeroSection.tsx`

#### 2.1 轮播Banner

自动轮播，每5秒切换一次。

| Banner ID | 标题 | 副标题 | 标签 | 动画效果 |
|-----------|------|--------|------|----------|
| 1 | Step-tts-2 | Text to speech large model | Hyper-realism, Emotional mastery, Instant cloning | 波形动画 (Waveform) |
| 2 | Step-Audio-EditX | Audio edit large model | Hyper-realism, Emotional mastery, Instant cloning | 粒子动画 (Particles) |

#### 2.2 交互元素

- **"Use now" 按钮**：主要CTA按钮，青色渐变背景
- **"Introduction" 按钮**：次要按钮，透明边框样式
- **轮播指示器**：底部左侧，可点击切换Banner
- **滚动指示器**：底部中央，弹跳动画提示向下滚动

#### 2.3 背景设计

- 背景图片：`src/assets/hero-bg.jpg`
- 渐变遮罩：从左向右渐变，确保文字可读性

---

### 3. 语音平台体验区 (VoicePlatformSection)

**位置**：Hero区域下方

**组件文件**：`src/components/VoicePlatformSection.tsx`

#### 3.1 标题区

- **主标题**："探索AI语音的更多可能"
- **副标题**："领先的模型和工具助力行业变革"

#### 3.2 Tab切换区

| Tab ID | 名称 | 图标 | 组件 |
|--------|------|------|------|
| tts | 文本转语音 | MessageSquareText | TextToSpeechTab |
| clone | 语音复刻 | Mic2 | HomeVoiceCloneTab |
| edit | 语音编辑 | Wand2 | HomeVoiceEditTab |

---

### 4. 文本转语音 Tab (TextToSpeechTab)

**组件文件**：`src/components/TextToSpeechTab.tsx`

#### 4.1 示例场景

| Case ID | 标签 | 描述 | 音频标题 | 图标 | 渐变色 | 类型 |
|---------|------|------|----------|------|--------|------|
| case1 | 新闻播报 | Step 3模型发布 | Step 3发布 | 📰 | blue-cyan | 单条音频 |
| case2 | 有声读物 | 悬疑故事 | 午夜来信 | 📖 | purple-pink | 单条音频 |
| case3 | 客服助手 | 智能客服对话 | 订单查询 | 🎧 | green-emerald | 多轮对话 |

#### 4.2 预置音色

| 音色ID | 名称 | 用途 |
|--------|------|------|
| cixingnansheng | 磁性男声 | 新闻播报、客户对话 |
| tianmeinvsheng | 甜美女声 | 有声读物、客服对话 |

#### 4.3 对话脚本 (case3)

```
客服小美：您好，欢迎致电智能客服中心，请问有什么可以帮您？
客户先生：你好，我昨天下的订单显示已发货，但物流信息一直没更新。
客服小美：好的，请您提供一下订单号，我帮您查询。
客户先生：订单号是202412250001。
客服小美：已查到，您的包裹目前在转运中，预计明天送达，请您耐心等待。
客户先生：好的，谢谢！
```

#### 4.4 功能需求

1. **文本展示区**：显示当前选中示例的文本内容
2. **示例选择器**：点击切换不同示例场景，切换时停止当前播放
3. **播放按钮**：播放/暂停音频，显示对应状态图标
4. **音频来源优先级**：
   - 优先级1：内存缓存 (cachedAudioUrls)
   - 优先级2：存储预生成文件 (storageUrls)
   - 优先级3：实时API生成
5. **对话模式**：顺序播放多轮对话，自动切换下一句

#### 4.5 预生成音频文件

| Case ID | 存储路径 |
|---------|----------|
| case1 | tts/case1.mp3 |
| case2 | tts/case2.mp3 |
| dialogue-0 ~ dialogue-5 | tts/dialogue-0.mp3 ~ tts/dialogue-5.mp3 |

---

### 5. 语音复刻 Tab (HomeVoiceCloneTab)

**组件文件**：`src/components/home/HomeVoiceCloneTab.tsx`

#### 5.1 示例音色

| ID | 名称 | 性别 | 头像 | 原声文件 | 复刻文件 |
|----|------|------|------|----------|----------|
| cila | Cila | ♀ | avatar-female.png | voice-clone/cila-original.mp3 | voice-clone/cila-cloned.mp3 |
| john | John | ♂ | avatar-male.png | voice-clone/john-original.mp3 | voice-clone/john-cloned.mp3 |

#### 5.2 功能需求

1. 展示头像、名称、性别
2. 两个播放按钮：播放原声 / 播放复刻
3. 播放时显示波形动画
4. 同时只能播放一个音频

---

### 6. 语音编辑 Tab (HomeVoiceEditTab)

**组件文件**：`src/components/home/HomeVoiceEditTab.tsx`

#### 6.1 示例音频

| 属性 | 值 |
|------|-----|
| 文件路径 | voice-edit/xinxingren-maoxian.mp3 |
| 显示名称 | 星星人冒险.wav |
| 时长 | 00:10 |

#### 6.2 编辑参数（弹窗选择）

**情绪标签**：
高兴、愤怒、悲伤、幽默、困惑、厌恶、共情、尴尬、恐惧、惊讶、兴奋、沮丧、冷漠、钦佩

**风格标签**：
严肃、傲慢、儿童、单纯、夸张、少女、御姐、朗诵、甜美、空灵、豪爽、撒娇、温暖、害羞、安慰、权威、闲聊、电台、深情、温柔、磁性、中老年、悄悄话、气泡音、讲故事、绘声绘色、节目主持、新闻播报、广告营销、娱乐八卦、吼叫、小声、大声、低沉、高亢

**速度控制标签**：
快速、慢速、更快、更慢

#### 6.3 功能需求

1. **原始音频卡片**：播放/暂停按钮、编辑按钮
2. **编辑弹窗**：
   - 标题："参数设置"
   - 副标题："选择您想要的音色特征"
   - 标签多选
   - 取消/确认按钮
3. **编辑后音频卡片**：
   - 仅在编辑完成后显示
   - 播放/暂停按钮
   - 删除按钮
   - 显示"已编辑"标签
4. **生成状态**：Loading动画

---

### 7. 底部CTA区

**位置**：体验区卡片下方

- **文案**："前往体验中心体验完整能力"
- **按钮**："立即体验"
- **跳转**：`/playground`

---

## 三、技术规格

### 3.1 API接口

| 接口 | 路径 | 方法 | 用途 |
|------|------|------|------|
| TTS生成 | `/functions/v1/step-tts` | POST | 文本转语音 |

**请求参数**：
```json
{
  "text": "要转换的文本",
  "voice": "音色ID"
}
```

**响应**：音频Blob

### 3.2 存储配置

- **存储桶名称**：`audio`
- **访问权限**：公开读取

### 3.3 音频缓存策略

1. **内存缓存** (cachedAudioUrls)：运行时生成的音频URL
2. **Supabase Storage**：预生成的音频文件
3. **实时生成**：调用API生成新音频

### 3.4 全局音频管理

- 使用 `useGlobalAudio` Hook 统一管理播放状态
- 同一时间只允许一个音频播放
- 切换Tab或示例时自动停止当前播放

---

## 四、UI/UX规范

### 4.1 设计风格

- **卡片样式**：圆角 (rounded-xl/2xl)、边框、毛玻璃效果 (backdrop-blur)
- **动画效果**：fade-in 入场动画
- **响应式**：支持移动端适配 (md: 断点)

### 4.2 配色方案

使用设计系统 semantic tokens：
- `--primary`：主题色
- `--background`：背景色
- `--foreground`：前景色
- `--muted-foreground`：次要文字色
- `--border`：边框色
- `--card`：卡片背景色

### 4.3 交互状态

- **按钮hover**：透明度变化、阴影增强
- **播放状态**：波形动画显示
- **加载状态**：Loader2 旋转图标
- **禁用状态**：降低透明度

---

## 五、文件结构

```
src/
├── pages/
│   └── Index.tsx                    # 首页入口
├── components/
│   ├── Navbar.tsx                   # 导航栏
│   ├── HeroSection.tsx              # Hero区域
│   ├── VoicePlatformSection.tsx     # 语音平台体验区
│   ├── TextToSpeechTab.tsx          # 文本转语音Tab
│   └── home/
│       ├── HomeVoiceCloneTab.tsx    # 语音复刻Tab
│       └── HomeVoiceEditTab.tsx     # 语音编辑Tab
├── assets/
│   ├── hero-bg.jpg                  # Hero背景图
│   ├── avatar-female.png            # 女性头像
│   └── avatar-male.png              # 男性头像
└── hooks/
    └── useGlobalAudio.ts            # 全局音频管理Hook
```

---

## 六、版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2024-12-30 | 初始版本 |
