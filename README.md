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
│   ├── AI_SHORT_DRAMA_INDEX.md
│   ├── AI-ShortDrama-Technical-Route.md
│   ├── Character-Bible.md
│   ├── ShortDrama-Episodes.md
│   ├── Three-Sample-Episodes.md
│   └── ...
│
├── docx/                        # 《李聪传》出版指南（md / docx / txt）
├── music/                       # 各角色主题曲歌词
├── result/                      # 输出物（分章节 MD / DOCX / PDF）
│   ├── MD/
│   ├── DOCX/
│   └── PDF/
│
├── samples/                     # 三个样片的 10 阶段生产流水
│   ├── sample-a/                # 01-shotlist → 10-publishing
│   ├── sample-b/
│   └── sample-c/
│
├── tvc-storyboard-agent/        # AI Studio 下载的 React/Vite 前端项目
│   ├── App.tsx
│   ├── constants.ts             # 系统提示词
│   ├── services/                # Gemini 服务调用
│   └── ...
│
├── video/                       # 分镜/提示词批量生成脚本
└── .claude/                     # 本项目 Claude Code 配置与 skill 包
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

## 🚀 前端工程（tvc-storyboard-agent/）

从 Google AI Studio Builder 导出的 Vite + React + TypeScript 项目。

```bash
cd tvc-storyboard-agent
npm install
npm run dev
```

详见 [tvc-storyboard-agent/README.md](tvc-storyboard-agent/README.md)。

---

## 🛠️ 常用指令（Claude Code 内）

- `/prd` — 唤起 product-spec-builder 收集/迭代需求
- `/check` — 对照 Product Spec 检查代码完整度和 AI 实现一致性
- `/run` — 本地运行项目
- `/status` — 显示当前项目进度
- `/help` — 显示所有指令
