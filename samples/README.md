# Samples · 样片工作目录

每条样片独立目录，按 10 阶段生产流水组织。三条样片并行可做，主推顺序见 [../docs/AI_SHORT_DRAMA_INDEX.md §8](../docs/AI_SHORT_DRAMA_INDEX.md)。

---

## 🎬 三条样片

| 样片 | 标题 | 来源 | 用途 | 推荐优先级 |
|------|------|------|------|-----------|
| [sample-a](sample-a/) | 《西山的灯一直亮着》 | EP01 + EP02 | 建立 IP 气质与童年底色 | **1️⃣ 先做** |
| [sample-c](sample-c/) | 《遇见她以后》 | EP08 | 验证传播性与情感转化 | 2️⃣ |
| [sample-b](sample-b/) | 《那个不说话的男孩》 | EP03 + EP04 | 验证成长冲突与代入感 | 3️⃣ |

---

## 📂 10 阶段生产流水

每个样片都遵循同一套目录结构：

```
sample-X/
├── production-board.md              样片生产看板（状态总览）
├── sample-X-asset-manifest.md       必须落盘的资产清单
├── sample-X-execution-commands.md   执行命令脚本
├── sample-X-init-checklist.md       初始化检查清单
│
├── 01-shotlist/                     分镜表 + 时间轴
├── 02-prompts/                      图像 / 视频提示词
│   ├── image-prompts/               每镜头一个 txt
│   ├── video-prompts/               图生视频提示词
│   ├── prompt-index.md
│   ├── sample-X-prompt-pack.md
│   └── sample-X-model-prompt-split.md
├── 03-reference/                    参考素材
├── 04-keyframes/                    关键帧任务单 + 产出图
├── 05-video-clips/                  图生视频片段
├── 06-audio/                        配音 / BGM / SFX
│   ├── narration/
│   ├── dialogue/
│   ├── music/
│   ├── sfx/
│   └── sample-X-voice-script.md
├── 07-subtitles/                    字幕（ass / srt / captions json）
├── 08-edit/                         Remotion 剪辑输入
│   ├── remotion/
│   └── preview-renders/
├── 09-export/                       成片导出（main / 15s / 30s 切片）
└── 10-publishing/                   发布物料
    ├── metadata/                    平台 JSON + 预览状态
    ├── checklist/                   QA 检查清单
    └── copy/                        标题 / 简介 / 标签 / 封面文案
```

---

## 🛠️ 全局样片规范

所有样片共用这些规范文档，见 [../docs/](../docs/)：

- [Sample-Directory-Structure.md](../docs/Sample-Directory-Structure.md) — 目录结构 / 命名规则 / 资产落盘规则
- [Sample-Production-Checklist.md](../docs/Sample-Production-Checklist.md) — 样片级生产清单
- [Sample-Remotion-Plan.md](../docs/Sample-Remotion-Plan.md) — Remotion / FFmpeg 合成方案
- [Sample-Voice-Plan.md](../docs/Sample-Voice-Plan.md) — 旁白 / 对白 / BGM / 口型策略
- [Sample-Copy-Pack.md](../docs/Sample-Copy-Pack.md) — 平台文案包模板
- [Publishing-Ready-Pack-Checklist.md](../docs/Publishing-Ready-Pack-Checklist.md) — 发布包清单

---

## 🚀 从样片到前端工作台

前端工作台（[tvc-storyboard-agent/](../tvc-storyboard-agent/)）**Phase 1** 已预置 sample-a 的 9 个镜头作为 EP01 种子数据。后续 Phase 4-5 会支持从样片目录导入镜头表、驱动 AI 批量生成关键帧与视频片段。
