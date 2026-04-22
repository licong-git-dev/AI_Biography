# 《李聪传》AI短剧总索引

> 这是当前项目所有 AI 短剧策划与执行文档的总入口。用途：快速找到“现在有什么”“下一步做什么”“从哪份文件开始执行”。

---

## 1. 战略与规格层

### `Product-Spec.md`
用途：AI 短剧生产与分发工作台的产品规格说明。  
适合什么时候看：需要重新确认项目目标、功能边界、AI Studio 能力配置时。

### `Product-Spec-CHANGELOG.md`
用途：Product Spec 的版本变更记录。  
适合什么时候看：后续迭代 UI、功能、工作流时。

### `AI-ShortDrama-Technical-Route.md`
用途：整体技术路线、推荐工具栈、平台发布策略、MVP 路线。  
适合什么时候看：决定先做什么、用什么工具、为什么这样做时。

### `GitHub-Tooling-Selection.md`
用途：GitHub 工具选型与平台 API 调研结果。  
适合什么时候看：准备上 ComfyUI / StoryDiffusion / GPT-SoVITS / Remotion 等工具时。

### `Execution-Task-Breakdown.md`
用途：项目总任务拆解、阶段划分、样片优先级、验收标准。  
适合什么时候看：要把长期工作拆成阶段执行时。

---

## 2. 世界观与生产基线层

### `Character-Bible.md`
用途：角色圣经，统一李聪各年龄阶段和主要配角的视觉、气质、声音基线。  
适合什么时候看：生成关键帧、做角色一致性、做配音前。

### `Visual-Style-Bible.md`
用途：视觉风格圣经，统一色调、镜头语言、光影、字幕和平台画幅。  
适合什么时候看：生成图片、视频、封面、字幕样式前。

### `ShortDrama-Episodes.md`
用途：整季短剧规划，定义第一季主剧情集、切片矩阵和发布层级。  
适合什么时候看：从样片转向整季内容工厂时。

---

## 3. 样片策划层

### `Three-Sample-Episodes.md`
用途：三条样片总策划，包含钩子、高潮、悬念、平台标题和定位。  
适合什么时候看：决定先做哪条样片、每条样片讲什么时。

### `Sample-A-Shotlist.md`
用途：样片 A《西山的灯一直亮着》详细镜头表。  
执行入口：**先做这条。**

### `Sample-B-Shotlist.md`
用途：样片 B《那个不说话的男孩》详细镜头表。  
执行入口：Sample A、C 跑通后再做。

### `Sample-C-Shotlist.md`
用途：样片 C《遇见她以后》详细镜头表。  
执行入口：Sample A 跑通后优先做这条，验证传播性。

---

## 4. Prompt 与生成输入层

### `Sample-A-Prompt-Pack.md`
用途：样片 A 的图像/视频提示词包。  
适合什么时候看：进入关键帧和图生视频生产时。

### `Sample-B-Prompt-Pack.md`
用途：样片 B 的提示词包。

### `Sample-C-Prompt-Pack.md`
用途：样片 C 的提示词包。

---

## 5. 生产执行层

### `Sample-Production-Checklist.md`
用途：样片级生产清单，明确必须做的资产、关键动态图镜头、音频需求和导出规格。  
适合什么时候看：开始实际生产前。

### `Sample-Directory-Structure.md`
用途：目录结构规范、命名规则、资产落盘规则。  
适合什么时候看：要开始创建 `samples/`、`exports/`、`publishing/` 目录时。

### `Sample-A-Asset-Manifest.md`
用途：样片 A 必须落盘的资产清单。  
适合什么时候看：逐项验收 sample-a 的关键帧、视频、音频、字幕和导出物时。

### `Sample-B-Asset-Manifest.md`
用途：样片 B 资产清单。

### `Sample-C-Asset-Manifest.md`
用途：样片 C 资产清单。

### `sample-a.json`
用途：样片 A 的元数据模板，用于状态追踪和后续批量脚本接入。

### `sample-b.json`
用途：样片 B 元数据模板。

### `sample-c.json`
用途：样片 C 元数据模板。

---

## 6. 音频与合成层

### `Sample-Voice-Plan.md`
用途：样片 A/B/C 的旁白、对白、环境音、BGM、口型策略。  
适合什么时候看：准备 GPT-SoVITS、环境音、WhisperX 时。

### `Sample-Remotion-Plan.md`
用途：Remotion / FFmpeg 合成方案，定义时间线层级、字幕、转场、导出逻辑。  
适合什么时候看：准备把关键帧、视频、音频正式合成为成片时。

---

## 7. 发布层

### `Publishing-Ready-Pack-Checklist.md`
用途：平台发布准备包清单和各平台人工发布检查项。  
适合什么时候看：视频准备发布时。

### `Sample-Copy-Pack.md`
用途：三条样片的平台文案包，包括标题、简介、标签、置顶评论、封面文案。  
适合什么时候看：导出封面与发布包时。

---

## 8. 推荐执行顺序

### 第一优先级
1. `Sample-A-Shotlist.md`
2. `Sample-A-Prompt-Pack.md`
3. `Sample-A-Asset-Manifest.md`
4. `Sample-Voice-Plan.md`
5. `Sample-Remotion-Plan.md`
6. `Sample-Copy-Pack.md`

### 第二优先级
1. `Sample-C-Shotlist.md`
2. `Sample-C-Prompt-Pack.md`
3. `Sample-C-Asset-Manifest.md`
4. `Sample-Voice-Plan.md`
5. `Sample-Remotion-Plan.md`
6. `Sample-Copy-Pack.md`

### 第三优先级
1. `Sample-B-Shotlist.md`
2. `Sample-B-Prompt-Pack.md`
3. `Sample-B-Asset-Manifest.md`
4. `Sample-Voice-Plan.md`
5. `Sample-Remotion-Plan.md`
6. `Sample-Copy-Pack.md`

---

## 9. 当前真实落盘状态

### 已完成
- `samples/sample-a/` 目录骨架已创建
- `samples/sample-b/` 目录骨架已创建
- `samples/sample-c/` 目录骨架已创建
- 三条样片的以下核心文件已归位到各自样片目录：
  - shotlist
  - timeline csv
  - prompt pack
  - model prompt split
  - voice script
  - captions json
  - remotion input json
  - publishing pack
  - metadata
  - qa checklist

### 当前意味着什么
这不再只是“根目录上一堆策划文档”，而是已经进入了：
**样片工作目录已可直接接真实素材生产。**

---

## 10. 如果继续自动推进，下一步最该做什么

### 立即可做
1. 开始 `sample-a` 首批关键帧生成
2. 按 `Sample-A-Keyframe-Tasklist.md` 先跑 A-01 / A-02 / A-04 / A-05 / A-06 / A-08
3. 把通过筛选的关键帧放入 `samples/sample-a/04-keyframes/approved/`
4. 录制或生成 `a-narration-main-v1.wav`
5. 进入 `sample-a-remotion-input.json` 对应的 preview 合成

### 再下一步
1. 产出 `a-01-clip-approved.mp4`、`a-05-clip-approved.mp4`、`a-06-clip-approved.mp4`、`a-08-clip-approved.mp4`
2. 生成主版 preview
3. 导出 15 秒爆点版和 30 秒预告版
4. 生成封面并进入人工终审发布

---

## 11. 一句话导航

**如果你现在只看一份文件就开工，那就先看 `samples/sample-a/01-shotlist/sample-a-shotlist.md`；如果你要知道全局怎么往下推，就看 `Next-Steps-Execution-Order.md`。**
