# 《李聪传》AI 短剧总索引

> 全项目策划与执行文档的总入口。每份文档标注了用途和使用时机。
> 仓库根目录 → [README.md](../README.md)。

---

## 1. 战略与规格层（root）

| 文档 | 用途 | 使用时机 |
|------|------|---------|
| [Product-Spec.md](../Product-Spec.md) | AI 短剧生产工作台产品规格 | 确认项目目标、功能边界、AI Studio 能力配置 |
| [Product-Spec-CHANGELOG.md](../Product-Spec-CHANGELOG.md) | Product Spec 变更记录 | 后续迭代 UI / 功能 / 工作流时追溯 |
| [CLAUDE.md](../CLAUDE.md) | Claude Code 主控 Agent 规则 | 在本地用 Claude Code 开发时 |

---

## 2. 技术路线与工具

| 文档 | 用途 |
|------|------|
| [AI-ShortDrama-Technical-Route.md](AI-ShortDrama-Technical-Route.md) | 整体技术路线、工具栈、平台策略、MVP 路线 |
| [GitHub-Tooling-Selection.md](GitHub-Tooling-Selection.md) | ComfyUI / StoryDiffusion / GPT-SoVITS / Remotion 选型 |
| [Execution-Task-Breakdown.md](Execution-Task-Breakdown.md) | 任务拆解、阶段划分、验收标准 |
| [Next-Steps-Execution-Order.md](Next-Steps-Execution-Order.md) | 下一步执行顺序 |
| [FINAL_STATUS_REPORT.md](FINAL_STATUS_REPORT.md) | 项目阶段性状态报告 |

---

## 3. 世界观与生产基线

| 文档 | 用途 |
|------|------|
| [Character-Bible.md](Character-Bible.md) | 人物圣经（李聪各年龄段 + 主要配角的视觉 / 气质 / 声音基线） |
| [ShortDrama-Episodes.md](ShortDrama-Episodes.md) | 第一季 9 集规划、切片矩阵、发布层级 |
| [Three-Sample-Episodes.md](Three-Sample-Episodes.md) | 3 条样片的钩子 / 高潮 / 悬念 / 平台标题 / 定位 |

---

## 4. 样片级规范（适用于所有 sample-*/）

| 文档 | 用途 |
|------|------|
| [Sample-Directory-Structure.md](Sample-Directory-Structure.md) | 样片目录结构规范、命名规则、资产落盘规则 |
| [Sample-Production-Checklist.md](Sample-Production-Checklist.md) | 样片级生产清单 |
| [Sample-Remotion-Plan.md](Sample-Remotion-Plan.md) | Remotion / FFmpeg 合成方案 |
| [Sample-Voice-Plan.md](Sample-Voice-Plan.md) | 旁白 / 对白 / 环境音 / BGM / 口型策略 |
| [Sample-Copy-Pack.md](Sample-Copy-Pack.md) | 平台文案包（标题 / 简介 / 标签 / 置顶 / 封面文案） |
| [Publishing-Ready-Pack-Checklist.md](Publishing-Ready-Pack-Checklist.md) | 平台发布包清单和人工发布检查项 |

---

## 5. 样片工作目录

已归位到 `samples/sample-{a,b,c}/`，按 10 阶段生产流水组织：

```
01-shotlist   02-prompts   03-reference   04-keyframes   05-video-clips
06-audio      07-subtitles 08-edit        09-export      10-publishing
```

详见 [samples/README.md](../samples/README.md)。

每个样片包含：
- `production-board.md` — 样片生产看板（状态总览）
- `sample-X-asset-manifest.md` — 必须落盘的资产清单
- `sample-X-execution-commands.md` — 执行命令脚本
- `sample-X-init-checklist.md` — 初始化检查清单

---

## 6. 前端工作台

- 源码：[tvc-storyboard-agent/](../tvc-storyboard-agent/)
- 文档：[tvc-storyboard-agent/README.md](../tvc-storyboard-agent/README.md)
- 当前分支：`feature/rewrite`
- 已完成 Phase：0（骨架）· 1（数据层）· 2（tab 导航）· 3（角色编辑 + Nano Banana Pro 参考图）

---

## 7. 核心内容资产

| 目录 | 内容 |
|------|------|
| [result/MD/](../result/MD/) | 9 章书稿 Markdown |
| [result/DOCX/](../result/DOCX/) | 9 章 Word 版本 |
| [result/PDF/](../result/PDF/) | 9 章 PDF + 合集《李聪传.pdf》 |
| [docx/](../docx/) | 出版指南 |
| [music/](../music/) | 9 首角色主题曲歌词 |
| [video/](../video/) | 批量提示词生成脚本（Python） |

---

## 8. 推荐执行顺序

### 第一优先级（先打通 sample-a 闭环）
1. [samples/sample-a/01-shotlist/sample-a-shotlist.md](../samples/sample-a/01-shotlist/sample-a-shotlist.md)
2. [samples/sample-a/02-prompts/sample-a-prompt-pack.md](../samples/sample-a/02-prompts/sample-a-prompt-pack.md)
3. [samples/sample-a/sample-a-asset-manifest.md](../samples/sample-a/sample-a-asset-manifest.md)
4. [Sample-Voice-Plan.md](Sample-Voice-Plan.md)
5. [Sample-Remotion-Plan.md](Sample-Remotion-Plan.md)
6. [Sample-Copy-Pack.md](Sample-Copy-Pack.md)

### 第二优先级（sample-c — 验证传播性）
1. [samples/sample-c/01-shotlist/sample-c-shotlist.md](../samples/sample-c/01-shotlist/sample-c-shotlist.md)
2. [samples/sample-c/02-prompts/sample-c-prompt-pack.md](../samples/sample-c/02-prompts/sample-c-prompt-pack.md)
3. [samples/sample-c/sample-c-asset-manifest.md](../samples/sample-c/sample-c-asset-manifest.md)

### 第三优先级（sample-b — 验证剧情厚度）
1. [samples/sample-b/01-shotlist/sample-b-shotlist.md](../samples/sample-b/01-shotlist/sample-b-shotlist.md)
2. [samples/sample-b/02-prompts/sample-b-prompt-pack.md](../samples/sample-b/02-prompts/sample-b-prompt-pack.md)
3. [samples/sample-b/sample-b-asset-manifest.md](../samples/sample-b/sample-b-asset-manifest.md)

---

## 9. 一句话导航

- 只看一份文件就开工：[samples/sample-a/01-shotlist/sample-a-shotlist.md](../samples/sample-a/01-shotlist/sample-a-shotlist.md)
- 想了解全局怎么推进：[Next-Steps-Execution-Order.md](Next-Steps-Execution-Order.md)
- 想用前端工作台管理生产：[tvc-storyboard-agent/README.md](../tvc-storyboard-agent/README.md)
