# AI_Biography · 《李聪传》AI 短剧生产线

本项目围绕 **《李聪传》** 这部 AI 生成的人物传记改编短剧，串联了从需求文档到分镜、关键帧、音频、成片、发布物料的完整流水线。

---

## 📂 目录结构

```
AI_Biography/
├── CLAUDE.md                    # 主控 Agent 指令（废才 · 产品经理/开发教练）
├── Product-Spec.md              # 产品需求文档
├── Product-Spec-CHANGELOG.md    # 需求变更记录
│
├── docs/                        # 方案、路线、章节设定、检查清单
│   ├── AI-ShortDrama-Technical-Route.md
│   ├── Character-Bible.md       # 人物圣经（李聪各年龄段 + 配角基线）
│   ├── ShortDrama-Episodes.md   # 第一季 9 集规划
│   ├── Three-Sample-Episodes.md
│   └── ...                      # 共 15 份支持文档
│
├── docx/                        # 《李聪传》出版指南（md / docx / txt）
├── music/                       # 9 首角色主题曲歌词
├── result/                      # 9 章书稿成品（MD / DOCX / PDF）
│   ├── MD/
│   ├── DOCX/
│   └── PDF/
│
├── samples/                     # 3 个样片的 10 阶段生产流水
│   ├── sample-a/                # 01-shotlist → 10-publishing
│   ├── sample-b/
│   └── sample-c/
│
├── tvc-storyboard-agent/        # 前端工作台（《李聪传》workbench）
│   ├── src/                     # React + TS 源码
│   │   ├── layout/              # Header + 三栏（Left/Center/Right）
│   │   ├── features/            # chapters/characters/episodes/shots
│   │   ├── types/               # Chapter/Character/Episode/Shot
│   │   ├── stores/              # Zustand
│   │   ├── data/                # 角色/集数种子 + 章节 loader
│   │   ├── services/            # API Key + Gemini（Phase 6 接入）
│   │   └── components/          # ApiKeyModal 等共用
│   └── public/data/             # 章节 MD / 人物圣经 / 集数规划
│
└── .claude/                     # Claude Code 配置与 skill 包
    ├── prompts/
    └── skills/product-spec-builder/
```

---

## 🗂️ 核心文档

| 文件 | 用途 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | Claude Code 主控 Agent 规则 |
| [Product-Spec.md](Product-Spec.md) | 产品需求文档 |
| [docs/Character-Bible.md](docs/Character-Bible.md) | 人物圣经 |
| [docs/AI-ShortDrama-Technical-Route.md](docs/AI-ShortDrama-Technical-Route.md) | AI 短剧技术路线 |
| [docs/ShortDrama-Episodes.md](docs/ShortDrama-Episodes.md) | 分集设定 |

---

## 🎬 样片生产流水（samples/sample-*/）

每个样片目录均遵循 10 阶段：

```
01-shotlist      分镜 & 时间轴
02-prompts       图像/视频提示词
03-reference     参考素材
04-keyframes     关键帧任务单
05-video-clips   视频片段
06-audio         配音脚本
07-subtitles     字幕
08-edit          Remotion 剪辑
09-export        成片导出
10-publishing    发布物料（QA / 文案 / metadata）
```

---

## 🚀 前端工作台（tvc-storyboard-agent/）

**状态**：按 [Product-Spec.md](Product-Spec.md) 重写的《李聪传》工作台已全部功能落地。整条 AI 生产链打通：

```
章节 → AI 拆集 → 短剧集 → AI 镜头表 → 关键帧 → 图生视频 → 配音 → 4 平台发布文案
```

技术栈：Vite 6 + React 19 + TypeScript + Zustand v5 + `@google/genai` 1.34（Gemini 3 Pro / Nano Banana Pro / Veo 3 / Gemini TTS）。

本地运行：

```bash
cd tvc-storyboard-agent
cp .env.example .env.local            # 填 GEMINI_API_KEY
npm install
npm run dev                           # http://localhost:3000
```

完整端到端流程和架构见 [tvc-storyboard-agent/README.md](tvc-storyboard-agent/README.md)。
逐 Phase 的重写记录见 [Product-Spec-CHANGELOG.md](Product-Spec-CHANGELOG.md) v2.0 条目。

### 功能矩阵

| Spec 能力 | 实现位置 | 状态 |
|----------|---------|------|
| 角色一致性（6 视图参考图） | `features/characters/characterService.ts` | ✅ |
| 章节 → 集数 AI 拆集 | `features/chapters/chapterService.ts` | ✅ |
| 集数 → 镜头表 AI 生成 | `features/episodes/episodeService.ts` | ✅ |
| 关键帧 9:16 生成（单/批量/中止） | `features/shots/shotService.ts` | ✅ |
| 图生视频（Veo 3） | `features/video/videoService.ts` | ✅ |
| 旁白 / 对白配音（Gemini TTS） | `features/audio/voiceService.ts` | ✅ |
| 字幕转写（SRT） | `features/audio/voiceService.ts` | ✅ |
| 多平台发布文案 | `features/publishing/publishingService.ts` | ✅ |
| 上下文感知对话 | `features/chat/chatService.ts` | ✅ |
| 16:9 / 1:1 版本切换 | — | ❌ 未做 |
| 封面图生成 | — | ❌ 未做（只有封面文案） |
| 批量视频 / 批量配音 | — | ❌ 未做（单镜头级已有） |

---

## 🛠️ 常用指令（Claude Code 内）

- `/prd` — 唤起 product-spec-builder 收集/迭代需求
- `/check` — 对照 Product Spec 检查代码完整度和 AI 实现一致性
- `/run` — 本地运行项目
- `/status` — 显示当前项目进度
- `/help` — 显示所有指令
