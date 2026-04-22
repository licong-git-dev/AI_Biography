# 《李聪传》AI短剧技术路线

## 1. 目标定义

目标不是一次性做完一部长片，而是搭建一条可持续复用的 AI 短剧生产线：

1. 将《李聪传》9 章内容重构为短剧集与内容切片
2. 先做“AI 漫剧 / 动态漫画短剧”MVP
3. 再升级关键镜头的图生视频与口型质量
4. 最后形成多平台发布准备与半自动分发体系

## 2. 推荐形态

### Phase 1：AI 漫剧 / 动态短剧（MVP）
- 片长：45-90 秒/条
- 镜头数：8-12 个
- 结构：3 秒钩子 + 40-60 秒剧情推进 + 10 秒情绪放大 + 3 秒悬念结尾
- 画面占比：
  - 70% 静图 + 镜头运动
  - 20% 图生视频
  - 10% 角色口型特写

### Phase 2：高质量短剧单集
- 片长：90-180 秒/条
- 增加更高质量图生视频、角色声线和情绪段落
- 增加多角色对白特写镜头

### Phase 3：内容工厂
- 批量生产剧情版 / 爆点版 / 人物版 / 金句版
- 建立平台版导出与发布日历
- 形成固定周更/日更机制

## 3. 内容生产架构

### 输入层
- `result/MD/*.md`：章节正文
- `video/《李聪传》AI漫剧分镜头脚本.md`：长版 AI 漫剧分镜
- `video/《李聪传》真人版分镜剧本.md`：真人化镜头参考
- `video/镜头JSON/*.json`：结构化镜头资产
- `video/生成结果/**/视频生成提示词.md`：可复用 prompt 资产

### 中间层
- 章节拆集表
- 角色卡 / 场景卡 / 风格基线
- 标准镜头表（镜号、时长、画面、旁白、对白、技术建议）
- 关键帧任务队列
- 视频任务队列
- 音频任务队列
- 发布任务队列

### 输出层
- 平台主版视频（9:16）
- 15 秒 / 30 秒切片
- 封面图
- 标题 / 简介 / 标签包
- 人工发布清单

## 4. 推荐工具栈

### A. 编排与工作流总控
- **ComfyUI**：节点化生成工作流总控，适合串联出图、视频、放大、修复等流程
  - GitHub: https://github.com/comfyanonymous/ComfyUI
- **Remotion**：程序化视频排版与批量渲染，适合模板化输出多平台版本
  - GitHub: https://github.com/remotion-dev/remotion

### B. 角色一致性
- **StoryDiffusion**：长序列角色一致性图像/视频生成
  - GitHub: https://github.com/HVision-NKU/StoryDiffusion

### C. 图生视频 / 文生视频
- **FramePack**：更适合做长帧序列与“让镜头动起来”的生产型方案
  - GitHub: https://github.com/lllyasviel/FramePack
- **AnimateDiff**：成熟的动画化方案，适合作为备用视频生成路线
  - GitHub: https://github.com/guoyww/AnimateDiff

### D. 口型 / 对白镜头
- **MuseTalk**：高质量实时 lip-sync，适合关键对白特写镜头
  - GitHub: https://github.com/TMElyralab/MuseTalk
- **LatentSync**：可作为更高质量口型同步备选
  - GitHub: https://github.com/bytedance/LatentSync

### E. 配音
- **GPT-SoVITS**：中文项目优先，适合角色声线与旁白生成
  - GitHub: https://github.com/RVC-Boss/GPT-SoVITS

### F. 字幕 / 时间轴
- **WhisperX**：支持词级时间戳，适合字幕对齐与切片重排
  - GitHub: https://github.com/m-bain/whisperX

### G. 后处理 / 辅助切分
- **PySceneDetect**：镜头检测与二次切片辅助
  - GitHub: https://github.com/Breakthrough/PySceneDetect
- **FFmpeg**：拼接、字幕烧录、封面抽帧、平台格式导出

## 5. 平台发布路线

## 5.1 当前确认到的公开能力
- **抖音**：可确认存在公开视频上传/创建能力，需申请权限并经过用户授权
  - 创建视频: https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/create-video/
  - 上传视频: https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/upload/
  - 分片上传: https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/slice-upload/

## 5.2 当前未稳定确认的公开能力（截至 2026-04-13）
- 微信视频号：未在本次调研中稳定确认到适合普通开发者的公开“视频内容发布 API”文档
- 小红书：检索到开放平台信息，但未在本次调研中稳定确认到面向普通创作者的公开视频发布能力文档
- B站：未在本次调研中稳定确认到公开的普通创作者视频投稿 API 文档

## 5.3 实际建议
- **第一阶段**：统一生成“人工发布包”，由人工终审上传到所有平台
- **第二阶段**：抖音优先接官方开放接口；其他平台保留人工发布流程
- **第三阶段**：若后续确认到稳定公开接口，再补平台自动发布模块

## 6. MVP 方案

### 样片优先级
先做 3 条样片：
1. 童年篇：西山脚下 / 两个家
2. 少年篇：少年心事 / 转学记
3. 情感篇：遇见她

### MVP 最小交付
- 3 条 60-90 秒竖屏主版
- 每条 1 个 15 秒切片
- 每条 1 套封面、标题、简介、标签
- 一套角色卡（幼年/童年/少年/青年李聪 + 主要亲属）
- 一套统一风格基线（暖黄色调、胶片感、现实水彩/怀旧写实）

## 7. 风险与应对

### 风险 1：角色一致性不稳
- 对策：先固定角色卡，再批量出关键帧，不直接逐镜自由生成

### 风险 2：全片图生视频成本过高
- 对策：大量镜头采用静图 + 运动，情绪高潮再升级图生视频

### 风险 3：平台 API 不确定
- 对策：把自动化重点放在“内容准备包”，而不是一开始赌全自动发布

### 风险 4：章节篇幅过长，不适合直接照搬
- 对策：必须按短视频逻辑重构钩子、冲突、悬念与收束

## 8. 下一阶段建议

1. 先完成 3 条样片的章节拆集与镜头重构
2. 完成角色卡和风格基线库
3. 用 Remotion 定义 9:16 短剧模板
4. 用 ComfyUI 串联关键帧与图生视频工作流
5. 先做抖音发布准备包，再扩展到视频号/小红书/B站
