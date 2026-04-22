# Sample B 目录初始化清单

> 目的：先把 `sample-b` 的目录骨架和占位文件定义清楚，便于手工或后续脚本初始化。

## 1. 建议目录

```text
samples/sample-b/
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
- `Sample-B-Shotlist.md`
- `sample-b-timeline.csv`

### 放入 `02-prompts/`
- `Sample-B-Prompt-Pack.md`
- `Sample-B-Model-Prompt-Split.md`

### 放入 `06-audio/`
- `Sample-B-Voice-Script.md`

### 放入 `07-subtitles/`
- `sample-b-captions.json`

### 放入 `08-edit/remotion/`
- `sample-b-remotion-input.json`

### 放入 `10-publishing/copy/`
- 从 `Sample-B-Publishing-Pack.md` 提取主文案

### 放入 `10-publishing/metadata/`
- `sample-b.json`

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
- `b-01-keyframe-v1.png`
- `b-03-keyframe-v1.png`
- `b-05-keyframe-v1.png`
- `b-07-keyframe-v1.png`
- `b-08-keyframe-v1.png`

### 视频镜头
- `b-01-clip-v1.mp4`
- `b-03-clip-v1.mp4`
- `b-05-clip-v1.mp4`
- `b-07-clip-v1.mp4`
- `b-08-clip-v1.mp4`

### 音频
- `b-narration-main-v1.wav`
- `b-dialogue-mother-v1.wav`
- `b-dialogue-boy-v1.wav`
- `b-dialogue-teacher-v1.wav`
- `b-bgm-main-v1.wav`

## 5. 初始化顺序

1. 建目录
2. 放文档
3. 放 metadata
4. 建占位文件
5. 开始关键帧生产

## 6. 一句话规则

**Sample B 的目录不要和 Sample A 混用，少年篇的素材、音频和导出必须独立管理。**
