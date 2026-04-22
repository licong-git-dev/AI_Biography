# Sample A Prompt Index

> 用途：列出 sample-a 已准备好的逐镜头 prompt 文件，方便直接按顺序投喂模型。

## 使用顺序

### 第一批必须先跑
1. `image-prompts/a-01-image-prompt.txt`
2. `image-prompts/a-02-image-prompt.txt`
3. `image-prompts/a-04-image-prompt.txt`
4. `image-prompts/a-05-image-prompt.txt`
5. `image-prompts/a-06-image-prompt.txt`
6. `image-prompts/a-08-image-prompt.txt`
7. `image-prompts/a-09-image-prompt.txt`

### 第二批补蒙太奇素材
1. `image-prompts/a-03-1-image-prompt.txt`
2. `image-prompts/a-03-2-image-prompt.txt`
3. `image-prompts/a-03-3-image-prompt.txt`
4. `image-prompts/a-03-4-image-prompt.txt`
5. `image-prompts/a-07-1-image-prompt.txt`
6. `image-prompts/a-07-2-image-prompt.txt`

## 视频 prompt 文件
1. `video-prompts/a-01-video-prompt.txt`
2. `video-prompts/a-02-video-prompt.txt`
3. `video-prompts/a-04-video-prompt.txt`
4. `video-prompts/a-05-video-prompt.txt`
5. `video-prompts/a-06-video-prompt.txt`
6. `video-prompts/a-07-video-prompt.txt`
7. `video-prompts/a-08-video-prompt.txt`

## 对应关系

| 镜头 | 图片 Prompt | 视频 Prompt | 优先级 |
|------|-------------|-------------|--------|
| A-01 | a-01-image-prompt.txt | a-01-video-prompt.txt | 高 |
| A-02 | a-02-image-prompt.txt | a-02-video-prompt.txt | 中 |
| A-03 | a-03-1~4-image-prompt.txt | 无 | 中 |
| A-04 | a-04-image-prompt.txt | a-04-video-prompt.txt | 中 |
| A-05 | a-05-image-prompt.txt | a-05-video-prompt.txt | 高 |
| A-06 | a-06-image-prompt.txt | a-06-video-prompt.txt | 高 |
| A-07 | a-07-1~2-image-prompt.txt | a-07-video-prompt.txt | 中 |
| A-08 | a-08-image-prompt.txt | a-08-video-prompt.txt | 高 |
| A-09 | a-09-image-prompt.txt | 无 | 中 |

## 一句话建议

先跑 A-01 / A-05 / A-06 / A-08，确认气质成立后，再补 A-03 和 A-07 的蒙太奇素材。
