# 《李聪传》AI 短剧生产工作台

> 把《李聪传》从书稿/素材库升级为可连载的 AI 短剧 IP 的生产与分发工作台。
> 对应根目录 [Product-Spec.md](../Product-Spec.md)。

## 状态

Phase 0-7 + 第二批 + 第三批全部完成。整个生产闭环已打通：

```
章节 → AI 拆集 → 短剧集 → AI 生成镜头表 → 镜头关键帧 → 图生视频 → 配音 → 发布文案
```

---

## 本地运行

前置：Node.js ≥ 18。

```bash
cd tvc-storyboard-agent
cp .env.example .env.local     # 在 .env.local 里填 GEMINI_API_KEY
npm install
npm run dev                    # http://localhost:3000
```

API Key 获取：<https://aistudio.google.com/apikey>

---

## 端到端流程

1. **顶部右上角**配置 API Key（数据只存在浏览器 localStorage）
2. **左栏**点一个角色（比如「奶奶」）→ **右栏**详情区点「生成 6 视图参考图（Nano Banana Pro）」→ 等 20-40 秒，角色一致性基线就绪
3. **中栏「章节」tab**点第一章 → 顶部 AI 拆集区选目标集数（默认 3）→ 「AI 拆集」→ 看提议卡片 → 「全部保存为集数」
4. **中栏「集数」tab**点某集让它变成活动态
5. **中栏「镜头」tab**（继承当前活动集） → 空态会出现「AI 生成镜头表」→ 提议预览 → 保存
6. 点镜头行 → 弹 **ShotKeyframeModal**，按需生成：
   - **关键帧**（9:16，Nano Banana Pro，自动附带角色参考图保一致）
   - **视频片段**（Veo 3，图生视频，基于关键帧作首帧）
   - **旁白 / 配音**（Gemini TTS，4 种声线可选）
7. 或回到**镜头 tab** 用「生成本集全部关键帧」批量（支持中止）
8. **右栏详情区底部**的「发布准备」→ 「生成平台文案」→ AI 一次性产出抖音 / 视频号 / 小红书 / B站 4 份差异化文案包，含合规清单状态
9. **右栏「询问 AI」**：上下文感知对话，自动注入当前选中的角色/集/章节

---

## 目录结构

```
tvc-storyboard-agent/
├── src/
│   ├── main.tsx                    入口
│   ├── App.tsx                     应用 shell，挂章节加载
│   │
│   ├── layout/                     三栏布局
│   │   ├── Header.tsx              顶栏：存储指示 + API Key 药丸
│   │   ├── Layout.tsx
│   │   ├── LeftPanel.tsx           项目 / 角色（分组 + ✓ 标记） / 素材
│   │   ├── CenterPanel.tsx         集数 | 章节 | 镜头 三 tab
│   │   └── RightPanel.tsx          详情 | 询问 AI 两 tab
│   │
│   ├── features/
│   │   ├── chapters/
│   │   │   ├── ChapterList.tsx
│   │   │   ├── ChapterDetail.tsx   + AI 拆集按钮 + 提议卡片
│   │   │   └── chapterService.ts   splitChapterIntoEpisodes()
│   │   ├── characters/
│   │   │   ├── CharacterReferencePanel.tsx
│   │   │   ├── CharacterEditModal.tsx
│   │   │   └── characterService.ts generateCharacterReference()
│   │   ├── episodes/
│   │   │   ├── EpisodeList.tsx
│   │   │   └── episodeService.ts   generateShotsForEpisode()
│   │   ├── shots/
│   │   │   ├── ShotTable.tsx       + 批量关键帧 + 中止
│   │   │   ├── ShotKeyframeModal.tsx  关键帧 + 视频 + 旁白 三区
│   │   │   └── shotService.ts      generateShotKeyframe() + batch
│   │   ├── video/
│   │   │   └── videoService.ts     generateShotVideo() · Veo 3
│   │   ├── audio/
│   │   │   └── voiceService.ts     generateSpeech() + transcribeAudio()
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx       流式对话 + 上下文徽章
│   │   │   └── chatService.ts      streamChatReply()
│   │   └── publishing/
│   │       ├── PublishingPanel.tsx 4 平台 tab + 合规清单
│   │       └── publishingService.ts generatePublishingPack()
│   │
│   ├── types/                      Chapter / Character / Episode / Shot / Publishing
│   ├── stores/                     Zustand（chapter/character/episode/shot/chat/ui）
│   ├── data/                       SEED 数据（10 角色 + 9 集 + sample-a 9 镜头）
│   ├── services/
│   │   ├── apiKey.ts               localStorage API Key 工具
│   │   ├── geminiClient.ts         共享客户端工厂 + MODELS 常量
│   │   ├── systemPrompt.ts         《李聪传》生产总控 SYSTEM_PROMPT_CORE
│   │   └── storageHealth.ts        localStorage 用量 + 驱逐 base64
│   └── components/
│       ├── Spinner.tsx
│       ├── ApiKeyModal.tsx
│       └── StorageIndicator.tsx
│
├── public/data/                    静态数据源（运行时 fetch）
│   ├── chapters/*.md               9 章书稿
│   ├── character-bible.md
│   └── episodes.md
│
├── .env.example
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 技术栈

- **Vite 6** + **React 19** + **TypeScript**（strict）
- **Zustand v5** with `persist` middleware（localStorage 持久化，v1 schema）
- **`@google/genai`** v1.34 — Gemini SDK
  - 文本：`gemini-3-pro-preview`（JSON 输出模式用于 AI 拆集 / 镜头表 / 发布文案）
  - 图像：`gemini-3-pro-image-preview`（Nano Banana Pro）
  - 视频：`veo-3.0-generate-preview`
  - TTS：`gemini-2.5-flash-preview-tts`
- **Tailwind CSS** 通过 CDN 注入（`<script src="https://cdn.tailwindcss.com">`）

---

## 数据持久化

- API Key → `localStorage.gemini_api_key`
- 角色（含参考图 base64）→ `localStorage.licong-characters`
- 集数（含 publishingPack）→ `localStorage.licong-episodes`
- 镜头（含关键帧 / 视频 / 配音 base64）→ `localStorage.licong-shots`
- 对话 → `localStorage.licong-chat`

每个 store 都有 `resetToSeed` 方法。Header 会在用量 >4MB 时显示存储指示器，>95% 时变红；点击可一键清除所有 base64 图像数据腾空间（结构化数据保留）。

---

## 已知约束

- Gemini 模型 ID 写死在 [`src/services/geminiClient.ts`](src/services/geminiClient.ts)。如果你的账号某个模型没开通或改名了，在那里改一个常量就行。
- Veo 生视频长且贵，单镜头可能几分钟。没做批量。
- 关键帧只生成 9:16 一个比例。Product Spec 的 16:9 / 1:1 切换没做（需要重生成关键帧）。
- 封面只生成文案，没生成封面图。
- `@google/genai` 的 `generateVideos` 方法如果 SDK 版本里还没暴露出来，`videoService` 会报明确的 "SDK 版本不支持 Veo 视频生成" 错误。

---

## 历史

此目录最初是从 Google AI Studio 下载的 **TVC 广告分镜 scaffold**，与 Product Spec 严重错配。在 `feature/rewrite` 分支上按 Spec 逐 Phase 重写为《李聪传》工作台。见根目录 [README.md](../README.md#前端工作台-tvc-storyboard-agent) 了解 Phase 拆分。
