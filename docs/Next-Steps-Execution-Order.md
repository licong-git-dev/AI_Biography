# 《李聪传》下一步执行顺序清单

> 目的：把当前已经产出的所有文档，整理成一个可直接继续自动推进的顺序化清单。

---

## 当前已完成的前置文档

### 战略与规格
1. `Product-Spec.md`
2. `Product-Spec-CHANGELOG.md`
3. `AI-ShortDrama-Technical-Route.md`
4. `GitHub-Tooling-Selection.md`
5. `Execution-Task-Breakdown.md`
6. `ShortDrama-Episodes.md`

### 角色与视觉
7. `Character-Bible.md`
8. `Visual-Style-Bible.md`

### 样片策划
9. `Three-Sample-Episodes.md`
10. `Sample-A-Shotlist.md`
11. `Sample-B-Shotlist.md`
12. `Sample-C-Shotlist.md`
13. `Sample-A-Prompt-Pack.md`
14. `Sample-B-Prompt-Pack.md`
15. `Sample-C-Prompt-Pack.md`
16. `Sample-Production-Checklist.md`
17. `Sample-Copy-Pack.md`
18. `Publishing-Ready-Pack-Checklist.md`
19. `Sample-Directory-Structure.md`

---

## 推荐执行顺序

## Phase 1：先把目录和版本骨架建起来
### Step 1
建立样片目录结构：
- `samples/sample-a/`
- `samples/sample-b/`
- `samples/sample-c/`

### Step 2
把对应文档复制/归位到样片目录：
- shotlist
- prompt pack
- copy pack
- metadata 模板

### Step 3
新增每个样片的 metadata 文件：
- `sample-a.json`
- `sample-b.json`
- `sample-c.json`

---

## Phase 2：先做 Sample A

### Step 4
根据 `Sample-A-Shotlist.md` 和 `Sample-A-Prompt-Pack.md`：
- 生成全部关键帧
- 每个镜头至少产出 2-3 个版本

### Step 5
筛选关键帧，人工确认：
- 人物是否稳定
- 西山和老屋气质是否成立
- 奶奶、童年李聪是否有记忆点

### Step 6
把 A-01 / A-05 / A-06 / A-08 升级为图生视频镜头

### Step 7
生成 Sample A 音频层：
- 主旁白
- 奶奶哼唱
- 环境音
- BGM

### Step 8
生成字幕与时间轴

### Step 9
用 Remotion / FFmpeg 输出：
- 主版
- 15 秒爆点版
- 30 秒预告版

### Step 10
套用 `Sample-Copy-Pack.md` 中的 Sample A 文案，导出封面与发布包

---

## Phase 3：再做 Sample C

### Step 11
根据 `Sample-C-Shotlist.md` 和 `Sample-C-Prompt-Pack.md` 生成关键帧

### Step 12
重点把以下镜头做精：
- C-01 第一眼相遇
- C-02 回头一笑
- C-05 九锅一堂长谈
- C-08 对视定格

### Step 13
输出 Sample C 三个版本：
- 主版
- 15 秒爆点版
- 30 秒预告版

### Step 14
导出 Sample C 的封面、标题、简介、标签、置顶评论

---

## Phase 4：最后做 Sample B

### Step 15
根据 `Sample-B-Shotlist.md` 和 `Sample-B-Prompt-Pack.md` 生成关键帧

### Step 16
重点把以下镜头做精：
- B-03 角落特写
- B-05 夜晚失眠
- B-07 冲突后沉默
- B-08 路灯背影

### Step 17
输出 Sample B 三个版本：
- 主版
- 15 秒爆点版
- 30 秒预告版

### Step 18
导出 Sample B 发布包

---

## Phase 5：开始平台化复用

### Step 19
对三条样片做统一回看，评估：
- 哪条最容易传播
- 哪条最能建立 IP 气质
- 哪条最适合做账号首发

### Step 20
确定首发顺序：
1. Sample A
2. Sample C
3. Sample B

### Step 21
把播放数据和评论反馈映射回：
- 哪类封面更有效
- 哪类标题更有效
- 哪类镜头最值得升级成动态图

### Step 22
再推进 EP04-EP09 的流水线化生产

---

## 如果继续自动推进，下一批最该生成的文件

1. `samples/sample-a/sample-a.json`
2. `samples/sample-b/sample-b.json`
3. `samples/sample-c/sample-c.json`
4. `Sample-A-Asset-Manifest.md`
5. `Sample-B-Asset-Manifest.md`
6. `Sample-C-Asset-Manifest.md`
7. `Sample-A-Voice-Plan.md`
8. `Sample-B-Voice-Plan.md`
9. `Sample-C-Voice-Plan.md`
10. `Sample-A-Remotion-Plan.md`

---

## 一句话执行建议

**不要三条一起硬做，先把 Sample A 跑通成片，再复制方法到 C，再复制到 B。**
