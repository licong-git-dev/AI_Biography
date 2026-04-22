# 《李聪传》样片目录结构规范

> 目的：统一 Sample A / B / C 的资产落盘方式，方便后续批量生产、版本迭代和自动脚本接入。

---

## 一、根目录建议结构

```text
project/
├── docs/
│   ├── Product-Spec.md
│   ├── Character-Bible.md
│   ├── Visual-Style-Bible.md
│   ├── ShortDrama-Episodes.md
│   └── ...
├── samples/
│   ├── sample-a/
│   ├── sample-b/
│   └── sample-c/
├── exports/
│   ├── sample-a/
│   ├── sample-b/
│   └── sample-c/
└── publishing/
    ├── sample-a/
    ├── sample-b/
    └── sample-c/
```

如果暂时不想大改现有目录，也可以先按下面的样片规范逐步建立，不要求一次性迁移全部历史文件。

---

## 二、每个样片的标准目录

### Sample A

```text
samples/sample-a/
├── 01-shotlist/
│   ├── sample-a-shotlist.md
│   └── sample-a-timeline.csv
├── 02-prompts/
│   ├── sample-a-prompt-pack.md
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
│   ├── sample-a.srt
│   ├── sample-a.ass
│   └── timings.json
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

Sample B / C 使用相同结构，只替换样片编号。

---

## 三、命名规则

## 1. 镜头级命名

### 关键帧
- `a-01-keyframe-v1.png`
- `a-01-keyframe-v2.png`
- `b-03-keyframe-approved.png`

### 视频镜头
- `a-01-clip-v1.mp4`
- `a-01-clip-approved.mp4`
- `c-02-clip-alt-01.mp4`

### 音频
- `a-narration-main-v1.wav`
- `b-dialogue-mother-v1.wav`
- `c-sfx-ferry-01.wav`

### 字幕
- `sample-a-main.srt`
- `sample-a-main.ass`
- `sample-a-timings.json`

---

## 四、导出命名规则

### 主版
- `sample-a-main-v1.mp4`
- `sample-b-main-v1.mp4`
- `sample-c-main-v1.mp4`

### 爆点版
- `sample-a-hook-15s-v1.mp4`
- `sample-b-hook-15s-v1.mp4`
- `sample-c-hook-15s-v1.mp4`

### 预告版
- `sample-a-trailer-30s-v1.mp4`
- `sample-b-trailer-30s-v1.mp4`
- `sample-c-trailer-30s-v1.mp4`

### 封面
- `sample-a-cover-01.jpg`
- `sample-a-cover-02.jpg`
- `sample-a-cover-title.jpg`

### 文案
- `sample-a-copy.md`
- `sample-b-copy.md`
- `sample-c-copy.md`

---

## 五、落盘规则

## 1. approved / rejected 分离
- 通过人工审核的素材必须进入 `approved/`
- 明确废弃的素材进入 `rejected/`
- 不要把未筛选素材直接混进最终导出目录

## 2. 原始素材与成品分离
- 原始生成镜头放 `raw/`
- 选中的正式镜头放 `approved/`
- 最终成片只放 `09-export/`

## 3. 每个样片必须有 metadata
建议在 `10-publishing/metadata/` 下维护：
- `sample-a.json`
- `sample-b.json`
- `sample-c.json`

字段建议：
- sampleId
- title
- sourceChapters
- characterBibleVersion
- visualStyleVersion
- shotlistVersion
- promptPackVersion
- exportVersion
- publishStatus

---

## 六、批量生产建议

### 先手工跑通，再脚本化
优先顺序：
1. 手工按目录跑通 Sample A
2. 跑通后复制目录模板给 Sample B / C
3. 再写脚本自动生成目录和命名骨架

### 建议脚本能力
后续可以新增一个脚本自动：
- 初始化 sample 目录
- 复制 shotlist / prompt pack
- 生成 metadata 模板
- 初始化 export / publishing 空目录

---

## 七、一句话原则

**目录的目的不是好看，是为了让“关键帧 → 视频镜头 → 音频字幕 → 导出发布”这条链条不会乱。**
