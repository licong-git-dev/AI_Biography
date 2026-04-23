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
├── video/                       # 分镜/提示词批量生成脚本（Python）
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

> **状态**：`main` 分支是最早从 AI Studio 下载的 TVC 广告模板（与 Product Spec 严重错配）。
> `feature/rewrite` 分支正在按 Product Spec 重写为《李聪传》工作台。
> 当前进度：**Phase 0（骨架）· Phase 1（数据层）· Phase 2（三栏 + tab 导航）** 已完成。

技术栈：Vite 6 + React 19 + TypeScript + Zustand + `@google/genai`（Nano Banana Pro）。

本地运行：

```bash
git checkout feature/rewrite          # 查看重写进度
cd tvc-storyboard-agent
cp .env.example .env.local            # 填 GEMINI_API_KEY
npm install
npm run dev                           # http://localhost:3000
```

详见 [tvc-storyboard-agent/README.md](tvc-storyboard-agent/README.md)。

### 接下来的 Phase

- **Phase 3** 角色卡编辑 + Nano Banana Pro 一致性参考图
- **Phase 4** 章节 → 集数拆集 AI + 镜头表自动生成
- **Phase 5** 关键帧批量生成（带角色参考图）
- **Phase 6** AI 系统提示词 + 对话面板
- **Phase 7** 打磨 / localStorage 持久化 / 错误态

---

## 🛠️ 常用指令（Claude Code 内）

- `/prd` — 唤起 product-spec-builder 收集/迭代需求
- `/check` — 对照 Product Spec 检查代码完整度和 AI 实现一致性
- `/run` — 本地运行项目
- `/status` — 显示当前项目进度
- `/help` — 显示所有指令
