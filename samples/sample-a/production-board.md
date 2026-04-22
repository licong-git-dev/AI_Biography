# Sample A 首轮生产进度板

> 用途：按镜头跟踪 sample-a 的关键帧、视频、音频、字幕、合成状态。进入真实生产后，只更新这一个板子就能知道卡在哪。

---

## 总体状态

- 目录骨架：已完成
- 文档归位：已完成
- Prompt 拆分：已完成
- 字幕基础文件：已完成
- 关键帧生成：未开始
- 动态镜头生成：未开始
- 旁白音频：未开始
- preview 合成：未开始
- 正式导出：未开始
- 发布终审：未开始

---

## 镜头级追踪

| 镜头 | 关键帧 | 动态视频 | 字幕 | 合成 | 备注 |
|------|--------|----------|------|------|------|
| A-01 西山清晨 | pending | pending | ready | pending | 第一优先级 |
| A-02 老屋外景 | pending | optional | ready | pending | 静图也可成立 |
| A-03 童年蒙太奇 | pending | not_needed | ready | pending | 由多张素材图组成 |
| A-04 奶奶哄睡 | pending | optional | ready | pending | 轻微动效即可 |
| A-05 父母背对背 | pending | pending | ready | pending | 冲突核心镜头 |
| A-06 父亲离开 | pending | pending | ready | pending | 情绪核心镜头 |
| A-07 公交往返两个家 | pending | optional | ready | pending | 蒙太奇素材镜头 |
| A-08 奶奶送别 | pending | pending | ready | pending | 封面候选镜头 |
| A-09 结尾定格 | pending | not_needed | ready | pending | 金句黑场配合 |

---

## 关键资产追踪

### 关键帧 approved
- [ ] a-01-keyframe-approved.png
- [ ] a-02-keyframe-approved.png
- [ ] a-04-keyframe-approved.png
- [ ] a-05-keyframe-approved.png
- [ ] a-06-keyframe-approved.png
- [ ] a-08-keyframe-approved.png
- [ ] a-09-keyframe-approved.png

### 动态镜头 approved
- [ ] a-01-clip-approved.mp4
- [ ] a-05-clip-approved.mp4
- [ ] a-06-clip-approved.mp4
- [ ] a-08-clip-approved.mp4

### 音频
- [ ] a-narration-main-v1.wav
- [ ] a-dialogue-grandma-v1.wav
- [ ] a-bgm-main-v1.wav
- [ ] birds-01.wav
- [ ] breakfast-stall-01.wav
- [ ] bus-01.wav

### 字幕
- [x] sample-a-captions.json
- [x] sample-a-main.srt
- [x] sample-a-main.ass

### 合成输入
- [x] sample-a-remotion-input.json
- [x] sample-a-timeline.csv

---

## 当前最小闭环

### 第 1 步
先完成：
- A-01
- A-05
- A-06
- A-08

### 第 2 步
再补：
- A-02
- A-04
- A-07
- A-09

### 第 3 步
落地音频：
- 主旁白
- 环境音
- 奶奶一句对白（可选）

### 第 4 步
做 preview 合成

---

## 当前阻塞点

- 还没有真实关键帧
- 还没有真实动态图镜头
- 还没有真实旁白音频

---

## Preview 完成定义

当以下条件都满足时，sample-a preview 视为完成：
- [ ] A-01 / A-05 / A-06 / A-08 四个动态图镜头可用
- [ ] 其余镜头静图可用
- [ ] 主旁白可用
- [ ] 字幕已挂载
- [ ] 导出一版 preview mp4

---

## 下一步直接动作

1. 打开 `samples/sample-a/02-prompts/prompt-index.md`
2. 先跑 A-01 / A-05 / A-06 / A-08
3. 每产出一个 approved 资产，就回到这个板子勾掉
