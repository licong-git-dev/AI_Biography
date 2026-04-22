# -*- coding: utf-8 -*-
"""
生成第一集所有镜头的视频提示词
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

import google.generativeai as genai

# 配置
API_KEY = "cr_e197d2fe12b01fcb3de49ed035aac6f1e51c735ab9eb6de3e9d9d52a204938c0"
API_ENDPOINT = "https://co.yes.vg/gemini"
MODEL_NAME = "gemini-3-pro-preview"

print("=" * 60)
print("《李聪传》第一集 - 全部视频提示词生成")
print("=" * 60)

# 初始化
genai.configure(
    api_key=API_KEY,
    transport="rest",
    client_options={"api_endpoint": API_ENDPOINT}
)
model = genai.GenerativeModel(MODEL_NAME)

# 加载镜头数据
json_path = Path("D:/app/PythonFiles/AI_Biography/video/镜头JSON/第一集_西山脚下.json")
with open(json_path, "r", encoding="utf-8") as f:
    episode = json.load(f)

output_dir = Path("D:/app/PythonFiles/AI_Biography/video/生成结果/第一集_视频提示词")
output_dir.mkdir(parents=True, exist_ok=True)

# 生成所有镜头的提示词
all_shots = episode['shots']
all_prompts = []

print(f"\n总共 {len(all_shots)} 个镜头需要生成提示词")

for i, shot in enumerate(all_shots):
    print(f"\n[{i+1}/{len(all_shots)}] {shot['shot_id']}: {shot.get('scene_name', shot['scene'])}")

    # 让Gemini生成适合视频AI的提示词
    request = f"""你是一个专业的AI视频生成提示词专家。请根据以下分镜信息，生成一个适合 可灵AI/Runway/Pika 等视频生成工具的英文提示词。

分镜信息：
- 场景：{shot['scene']}
- 时间：{shot['time']}
- 景别：{shot['shot_type']}
- 运镜：{shot['camera']}
- 时长：{shot['duration']}
- 画面描述：{shot['visual']}
- 情绪氛围：{shot['mood']}
- 色调：{episode['color_tone']}
- 技术要求：{shot['technical']}
- 角色：{', '.join(shot.get('characters', [])) if shot.get('characters') else '无'}

要求：
1. 直接输出英文提示词，不要有任何解释
2. 提示词要简洁有力，100-150词左右
3. 包含：场景、光线、镜头运动、色调、氛围
4. 适合AI视频生成工具理解
5. 风格：电影感、怀旧、温暖
"""

    try:
        response = model.generate_content(request)
        video_prompt = response.text.strip()

        # 保存
        all_prompts.append({
            "shot_id": shot['shot_id'],
            "scene": shot['scene'],
            "visual_cn": shot['visual'],
            "video_prompt": video_prompt
        })

        print(f"    ✓ OK")

    except Exception as e:
        print(f"    ✗ FAIL: {e}")
        all_prompts.append({
            "shot_id": shot['shot_id'],
            "scene": shot['scene'],
            "visual_cn": shot['visual'],
            "video_prompt": f"[生成失败: {e}]"
        })

# 保存所有提示词
output_file = output_dir / "第一集_全部视频提示词.md"
with open(output_file, "w", encoding="utf-8") as f:
    f.write("# 《李聪传》第一集 - 全部视频生成提示词\n\n")
    f.write("可直接复制到 **可灵AI / Runway / Pika** 等工具使用\n\n")
    f.write(f"共 {len(all_prompts)} 个镜头\n\n")
    f.write("---\n\n")

    for p in all_prompts:
        f.write(f"## {p['shot_id']} - {p['scene']}\n\n")
        f.write(f"**中文描述：** {p['visual_cn']}\n\n")
        f.write(f"**Video Prompt:**\n```\n{p['video_prompt']}\n```\n\n")
        f.write("---\n\n")

print(f"\n{'='*60}")
print(f"完成！共生成 {len(all_prompts)} 个视频提示词")
print(f"保存至: {output_file}")
print(f"{'='*60}")
