# Sample A 目录初始化清单

> 目的：不直接跑脚本，先把 `sample-a` 的目录骨架和占位文件一次性定义清楚，便于手工或后续脚本初始化。

## 1. 建议目录

```text
samples/sample-a/
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
- `Sample-A-Shotlist.md`
- `sample-a-timeline.csv`

### 放入 `02-prompts/`
- `Sample-A-Prompt-Pack.md`

### 放入 `06-audio/`
- `Sample-A-Voice-Script.md`

### 放入 `07-subtitles/`
- `sample-a-captions.json`

### 放入 `08-edit/remotion/`
- `sample-a-remotion-input.json`

### 放入 `10-publishing/copy/`
- 从 `Sample-Copy-Pack.md` 中提取 Sample A 部分

### 放入 `10-publishing/metadata/`
- `sample-a.json`

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
- `a-01-keyframe-v1.png`
- `a-02-keyframe-v1.png`
- `a-04-keyframe-v1.png`
- `a-08-keyframe-v1.png`

### 视频镜头
- `a-01-clip-v1.mp4`
- `a-05-clip-v1.mp4`
- `a-06-clip-v1.mp4`
- `a-08-clip-v1.mp4`

### 音频
- `a-narration-main-v1.wav`
- `a-dialogue-grandma-v1.wav`
- `a-bgm-main-v1.wav`
- `birds-01.wav`
- `breakfast-stall-01.wav`
- `bus-01.wav`

## 5. 初始化顺序

1. 建目录
2. 放文档
3. 放 metadata
4. 建占位文件
5. 开始关键帧生产

## 6. 一句话规则

**先把 Sample A 的目录骨架建干净，再往里面填资产，不要边生成边乱塞文件。**
