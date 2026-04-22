# 《李聪传》AI短剧 GitHub 工具选型清单

> 调研日期：2026-04-13
> 原则：优先官方仓库与官方文档；如果公开发布能力无法稳定确认，则明确标注“未确认”。

## 1. 推荐主栈

| 层级 | 工具 | 链接 | 推荐级别 | 用途 | 主要优点 | 主要缺点 |
|------|------|------|----------|------|----------|----------|
| 工作流总控 | ComfyUI | https://github.com/comfyanonymous/ComfyUI | A | 节点化生成工作流总控 | 灵活、生态大、适合批量生产 | 节点版本管理复杂 |
| 视频排版渲染 | Remotion | https://github.com/remotion-dev/remotion | A | 模板化视频编排与批量渲染 | 极适合内容工厂与多版本导出 | 需要工程开发能力 |
| 角色一致性 | StoryDiffusion | https://github.com/HVision-NKU/StoryDiffusion | A | 长序列角色一致性图像/视频生成 | 适合传记类持续角色 | 显存和整合成本较高 |
| 图生视频 | FramePack | https://github.com/lllyasviel/FramePack | A- | 长帧序列/镜头动态化 | 更偏生产型，长视频友好 | 依赖较重，模型下载大 |
| 图生视频备选 | AnimateDiff | https://github.com/guoyww/AnimateDiff | B+ | 动画化与短镜头视频生成 | 成熟、生态资料多 | 长片和一致性需配合其他工具 |
| 口型同步 | MuseTalk | https://github.com/TMElyralab/MuseTalk | A- | 关键对白镜头 lip-sync | 质量高、支持中文 | 更适合脸部特写 |
| 口型备选 | LatentSync | https://github.com/bytedance/LatentSync | B+ | 更高质量口型同步备选 | 研究质量强 | 集成复杂 |
| 配音 | GPT-SoVITS | https://github.com/RVC-Boss/GPT-SoVITS | A | 中文 TTS / 声线克隆 | 中文项目友好，角色声线可控 | 需注意声音版权与质量调优 |
| 字幕时间轴 | WhisperX | https://github.com/m-bain/whisperX | A | 语音识别与词级时间戳 | 字幕对齐能力强 | 需额外清洗中文文本 |
| 切镜辅助 | PySceneDetect | https://github.com/Breakthrough/PySceneDetect | B | 镜头检测与二次切片 | 适合后处理 | 不是主生成工具 |

## 2. 工具细化说明

### 2.1 ComfyUI
- 官方仓库：`comfyanonymous/ComfyUI`
- 定位：视觉 AI 生成工作流底座
- 适用阶段：关键帧生成、图生视频、放大、修脸、统一工作流
- 官方仓库说明其是模块化 graph/nodes 界面的视觉 AI 引擎，并支持 Windows/macOS/Linux 及多类 GPU。
- 适合《李聪传》的原因：你需要的是“持续生产线”，不是单次出图试玩。

### 2.2 StoryDiffusion
- 官方仓库：`HVision-NKU/StoryDiffusion`
- 定位：长序列角色一致性图像/视频生成
- 适用阶段：角色卡、章节关键帧、一致性画面库
- 官方仓库强调其可生成 consistent images and videos，并支持长序列角色一致性。
- 适合《李聪传》的原因：传记类项目的核心就是同一人物跨年龄阶段与跨集可识别。

### 2.3 FramePack
- 官方仓库：`lllyasviel/FramePack`
- 定位：让视频扩散更偏生产可用
- 适用阶段：让静态关键帧“动起来”
- 官方仓库强调可在较低显存下处理更长视频，并提醒 GitHub 仓库是唯一官方站点。
- 适合《李聪传》的原因：更适合做动态漫画式运动镜头。

### 2.4 AnimateDiff
- 官方仓库：`guoyww/AnimateDiff`
- 定位：成熟的动画化方案
- 适用阶段：短镜头动态化、ComfyUI 生态补充
- 官方仓库明确声明 GitHub 与 project page 为官方站点。
- 适合作为备选，不建议单独承担整条生产线。

### 2.5 MuseTalk
- 官方仓库：`TMElyralab/MuseTalk`
- 定位：高质量实时 lip-sync
- 适用阶段：角色对白特写镜头
- 官方仓库说明支持多语言音频，并可达到实时推理。
- 建议：不要整片都用，只对情绪高潮与关键对白镜头用。

### 2.6 GPT-SoVITS
- 官方仓库：`RVC-Boss/GPT-SoVITS`
- 定位：中文短样本配音 / 声线克隆
- 官方仓库标题明确强调“1 min voice data can also be used to train a good TTS model”。
- 适合《李聪传》的原因：旁白与角色声线都偏中文叙事场景。

### 2.7 WhisperX
- 官方仓库：`m-bain/whisperX`
- 定位：自动语音识别 + 词级时间戳
- 适用阶段：字幕、时间轴、切片重排
- 官方仓库强调 word-level timestamps。

### 2.8 Remotion
- 官方仓库：`remotion-dev/remotion`
- 定位：用 React 程序化制作视频
- 适用阶段：模板渲染、多平台版本导出、统一字幕/封面样式
- 适合《李聪传》的原因：你需要批量出 9:16 主版和多个切片版，Remotion 很适合做模板工厂。

## 3. 平台发布能力核验

## 3.1 已确认公开能力

### 抖音
- 创建视频（需 `video.create` 权限并用户授权）：
  - https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/create-video/
- 上传视频：
  - https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/upload/
- 分片上传：
  - https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/slice-upload/

结论：
- 抖音适合作为首个 API 对接平台
- 但仍需权限申请、用户授权、审核流程与发布感知设计

## 3.2 本次未稳定确认公开发布 API 的平台

### 微信视频号
- 本次检索未稳定确认到适合普通开发者的公开视频内容发布 API 文档
- 推论：先按人工发布流程设计，不建议当前版本承诺自动发布

### 小红书
- 本次检索到开放平台与开发资料入口，但未稳定确认到面向普通创作者的公开视频发布能力文档
- 推论：先做标题/简介/封面/标签自动准备，人工作最终发布

### B站
- 本次检索未稳定确认到普通创作者公开视频投稿 API 的官方开放文档
- 推论：先做人工发布包

## 4. 最终选型建议

### MVP 选型
- **总控**：ComfyUI + FFmpeg
- **一致性**：StoryDiffusion
- **动态化**：FramePack
- **配音**：GPT-SoVITS
- **字幕**：WhisperX
- **编排导出**：Remotion
- **发布**：抖音 API 预留 + 全平台人工终审发布包

### 为什么不建议一开始就全自动发布
1. 平台公开能力不对称
2. 合规与审核规则变化快
3. 你的关键瓶颈在内容生产，而不在最后一步点击上传
4. 先把“稳定做出 10 条好内容”这件事解决，才值得补自动分发
