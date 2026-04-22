# 《李聪传》AI 短剧生产工作台

> 把《李聪传》从书稿/素材库升级为可连载的 AI 短剧 IP 的生产与分发工作台。
> 对应根目录 [Product-Spec.md](../Product-Spec.md)。

## 当前阶段

**Phase 0（骨架）** — 三栏布局、目录结构、内置数据就位。
接下来：Phase 1（数据模型 + stores）→ Phase 2（布局功能化）→ Phase 3（角色管理）→ Phase 4（章节→集数 + 镜头表）→ Phase 5（关键帧生成）→ Phase 6（AI 提示词）→ Phase 7（打磨）。

## 本地运行

前置：Node.js ≥ 18。

```bash
cd tvc-storyboard-agent
cp .env.example .env.local     # 然后在 .env.local 里填 GEMINI_API_KEY
npm install
npm run dev                    # 默认 http://localhost:3000
```

API Key 获取：https://aistudio.google.com/apikey

## 目录结构

```
tvc-storyboard-agent/
├── src/
│   ├── main.tsx                  入口
│   ├── App.tsx                   应用 shell
│   │
│   ├── layout/                   三栏布局
│   │   ├── Layout.tsx
│   │   ├── LeftPanel.tsx         项目 / 角色 / 资产
│   │   ├── CenterPanel.tsx       集数 / 镜头表 / 时间线
│   │   └── RightPanel.tsx        AI 任务 / 预览 / 发布
│   │
│   ├── features/                 业务模块（Phase 3+ 填充）
│   │   ├── chapters/             章节 → 集数拆集
│   │   ├── characters/           角色卡 + 一致性基线
│   │   ├── episodes/             集数管理
│   │   └── shots/                镜头表 + 关键帧
│   │
│   ├── types/                    数据模型（Phase 1）
│   ├── stores/                   Zustand stores（Phase 1）
│   ├── data/                     内置初始数据（Phase 1）
│   ├── services/                 Gemini 调用 + 本地存储
│   └── components/               共用组件
│
├── public/data/                  静态数据源
│   ├── chapters/*.md             9 章书稿（来自 result/MD/）
│   ├── character-bible.md        人物圣经
│   └── episodes.md               短剧集规划
│
├── .env.example                  环境变量模板
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 技术栈

- Vite 6 + React 19 + TypeScript
- `@google/genai` — Gemini SDK（Nano Banana Pro 出图）
- `zustand` — 状态管理
- Tailwind CSS（CDN）

## 说明

- 所有 AI 调用走 Gemini API，API Key 存在 `localStorage`
- `public/data/` 下的 MD 文件在构建时以 `?raw` 形式导入为字符串（由 `src/data/` 解析为结构化数据）
