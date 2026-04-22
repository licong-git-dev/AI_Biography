# Sample C 目录初始化清单

> 目的：先把 `sample-c` 的目录骨架和占位文件定义清楚，便于手工或后续脚本初始化。

## 1. 建议目录

```text
samples/sample-c/
├── 01-shotlist/
├── 02-prompts/
│   ├── image-prompts/
│   └── video-prompts/
├── 03-reference/
│   ├── characters/
│   ├── scenes/
│   └── moodboard/
├── 04-keyframes/
│   ├── approved/
│   ├── rejected/
│   └── contact-sheet/
├── 05-video-clips/
│   ├── raw/
│   ├── approved/
│   └── alt-takes/
├── 06-audio/
│   ├── narration/
│   ├── dialogue/
│   ├── music/
│   └── sfx/
├── 07-subtitles/
├── 08-edit/
│   ├── remotion/
│   ├── ffmpeg/
│   └── preview-renders/
├── 09-export/
│   ├── main/
│   ├── hook-15s/
│   ├── trailer-30s/
│   ├── no-subtitles/
│   └── burned-subtitles/
└── 10-publishing/
    ├── cover/
    ├── copy/
    ├── metadata/
    └── checklist/
```

## 2. 应复制进去的现有文件

### 放入 `01-shotlist/`
- `Sample-C-Shotlist.md`
- `sample-c-timeline.csv`

### 放入 `02-prompts/`
- `Sample-C-Prompt-Pack.md`
- `Sample-C-Model-Prompt-Split.md`

### 放入 `06-audio/`
- `Sample-C-Voice-Script.md`

### 放入 `07-subtitles/`
- `sample-c-captions.json`

### 放入 `08-edit/remotion/`
- `sample-c-remotion-input.json`

### 放入 `10-publishing/copy/`
- 从 `Sample-C-Publishing-Pack.md` 提取主文案

### 放入 `10-publishing/metadata/`
- `sample-c.json`

## 3. 占位文件建议

在以下目录预先创建 `.gitkeep` 或 `README.md`：
- `04-keyframes/approved/`
- `05-video-clips/approved/`
- `06-audio/narration/`
- `06-audio/dialogue/`
- `06-audio/music/`
- `06-audio/sfx/`
- `09-export/main/`
- `10-publishing/cover/`

## 4. 第一批必须生成的正式文件名

### 关键帧
- `c-01-keyframe-v1.png`
- `c-02-keyframe-v1.png`
- `c-05-keyframe-v1.png`
- `c-08-keyframe-v1.png`

### 视频镜头
- `c-01-clip-v1.mp4`
- `c-02-clip-v1.mp4`
- `c-05-clip-v1.mp4`
- `c-08-clip-v1.mp4`

### 音频
- `c-narration-main-v1.wav`
- `c-dialogue-zhangke-v1.wav`
- `c-dialogue-licong-v1.wav`
- `c-bgm-main-v1.wav`

## 5. 初始化顺序

1. 建目录
2. 放文档
3. 放 metadata
4. 建占位文件
5. 开始关键帧生产

## 6. 一句话规则

**Sample C 的目录要优先服务“情绪传播”，封面、长谈、对视这些资产要单独管理好。**
