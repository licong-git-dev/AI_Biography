# Sample A 执行命令清单

> 目的：把 Sample A 从文档阶段推进到可执行阶段。这里先给出按顺序执行的操作清单与命令模板，不假设你当前已经装好所有工具。

---

## 0. 准备工作

### 核对输入文件
先确认以下文件已存在：
- `Sample-A-Shotlist.md`
- `Sample-A-Prompt-Pack.md`
- `Sample-A-Model-Prompt-Split.md`
- `Sample-A-Voice-Script.md`
- `sample-a-timeline.csv`
- `sample-a-captions.json`
- `sample-a-remotion-input.json`
- `sample-a.json`

### 建目录骨架
如果还没建 `samples/sample-a/`，先按 `Sample-A-Init-Checklist.md` 创建。

---

## 1. 关键帧阶段

### Step 1.1 生成关键帧任务顺序
优先顺序：
1. A-01 西山清晨
2. A-02 老屋外景
3. A-04 奶奶哄睡
4. A-05 父母背对背
5. A-06 父亲离开
6. A-08 奶奶送别
7. A-03 蒙太奇素材
8. A-07 公交素材
9. A-09 结尾定格

### Step 1.2 落盘命名
把筛选通过的关键帧保存到：
- `samples/sample-a/04-keyframes/approved/a-01-keyframe-approved.png`
- `samples/sample-a/04-keyframes/approved/a-02-keyframe-approved.png`
- `samples/sample-a/04-keyframes/approved/a-04-keyframe-approved.png`
- `samples/sample-a/04-keyframes/approved/a-05-keyframe-approved.png`
- `samples/sample-a/04-keyframes/approved/a-06-keyframe-approved.png`
- `samples/sample-a/04-keyframes/approved/a-08-keyframe-approved.png`

### Step 1.3 接触表 / 联系图
把多张备选拼成联系图，放入：
- `samples/sample-a/04-keyframes/contact-sheet/`

---

## 2. 图生视频阶段

### 必做动态图镜头
- A-01
- A-05
- A-06
- A-08

### 输出文件名
- `samples/sample-a/05-video-clips/approved/a-01-clip-approved.mp4`
- `samples/sample-a/05-video-clips/approved/a-05-clip-approved.mp4`
- `samples/sample-a/05-video-clips/approved/a-06-clip-approved.mp4`
- `samples/sample-a/05-video-clips/approved/a-08-clip-approved.mp4`

### 操作规则
- 每个镜头至少生成 2 个版本
- 只保留最稳的 1 个到 `approved/`
- 其余放 `alt-takes/`

---

## 3. 音频阶段

### 旁白录制
根据 `Sample-A-Voice-Script.md` 录制：
- `samples/sample-a/06-audio/narration/a-narration-main-v1.wav`

### 对白录制
如要做奶奶一句对白：
- `samples/sample-a/06-audio/dialogue/a-dialogue-grandma-v1.wav`

### 环境音落盘
- `samples/sample-a/06-audio/sfx/birds-01.wav`
- `samples/sample-a/06-audio/sfx/breakfast-stall-01.wav`
- `samples/sample-a/06-audio/sfx/bus-01.wav`

### BGM 落盘
- `samples/sample-a/06-audio/music/a-bgm-main-v1.wav`

---

## 4. 字幕阶段

### 基础文件
把字幕主文件放到：
- `samples/sample-a/07-subtitles/sample-a-captions.json`
- `samples/sample-a/07-subtitles/sample-a-main.srt`
- `samples/sample-a/07-subtitles/sample-a-main.ass`

### 时间轴校对
以 `sample-a-timeline.csv` 为准校对字幕长度。

---

## 5. Remotion / FFmpeg 合成阶段

### 输入文件放置
- `sample-a-remotion-input.json` → `samples/sample-a/08-edit/remotion/`

### 逻辑顺序
1. 导入 approved 视频镜头
2. 导入 approved 关键帧
3. 导入 narration / music / sfx
4. 导入 captions
5. 生成主版 preview
6. 检查无误后导出正式版本

### 导出目标
- `samples/sample-a/09-export/main/sample-a-main-v1.mp4`
- `samples/sample-a/09-export/hook-15s/sample-a-hook-15s-v1.mp4`
- `samples/sample-a/09-export/trailer-30s/sample-a-trailer-30s-v1.mp4`
- `samples/sample-a/09-export/no-subtitles/sample-a-main-no-subtitles-v1.mp4`
- `samples/sample-a/09-export/burned-subtitles/sample-a-main-burned-subtitles-v1.mp4`

---

## 6. 发布准备阶段

### 封面
导出到：
- `samples/sample-a/10-publishing/cover/sample-a-cover-01.jpg`
- `samples/sample-a/10-publishing/cover/sample-a-cover-02.jpg`
- `samples/sample-a/10-publishing/cover/sample-a-cover-03.jpg`

### 文案
保存到：
- `samples/sample-a/10-publishing/copy/sample-a-copy.md`

### 元数据
保存到：
- `samples/sample-a/10-publishing/metadata/sample-a.json`

### 发布检查单
保存到：
- `samples/sample-a/10-publishing/checklist/sample-a-publish-checklist.md`

---

## 7. 最终顺序总结

1. 建目录
2. 生成关键帧
3. 筛图
4. 生成动态图镜头
5. 录旁白 / 收环境音 / 准备 BGM
6. 做字幕
7. Remotion 合成 preview
8. 导出正式版本
9. 生成封面与文案
10. 人工终审发布

---

## 8. 一句话原则

**不要同时推三条，先把 Sample A 从关键帧一路跑到主版成片。**
