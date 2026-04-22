import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { IntentResult, DynamicOption, ProductFeatures, ModelFeatures, Script, ScriptAnalysis, ScriptGuideAnswers } from "../types";

// Helper to remove code blocks if present (e.g., ```json ... ```)
const cleanJson = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

// 已实现的功能清单 - 用于验证 AI 生成的选项（并行入口模式 + 引导问答）
const VALID_ACTIONS = new Set([
  'UPLOAD_PRODUCT_TRIGGER',
  'UPLOAD_MODEL_TRIGGER',
  'select_from_library',
  'add_model',
  'skip_model',
  'skip_to_script',
  'upload_script',
  'generate_script',
  'edit_script',
  'edit_shot_description',
  'add_delete_shot',
  'reorder_shots',
  'generate_storyboard',
  'regenerate_all',
  'regenerate_selected',
  'reupload_product',
  'reupload_model',
  'cancel',
  'export',
  'open_settings',
  // v3.2 引导问答相关
  'style_cinematic',
  'style_mv',
  'style_documentary',
  'style_experimental',
  'opening_impact',
  'opening_suspense',
  'opening_emotion',
  'opening_contrast',
  'curve_buildup',
  'curve_intense',
  'curve_steady',
  'curve_twist',
  'duration_15s',
  'duration_30s',
  'duration_60s',
  'skip_reference',
  'confirm_generate',
  'add_more',
  // v3.2 脚本分析相关
  'optimize_script',
  'edit_script_myself',
  'skip_to_storyboard',
]);

// Get API Key from localStorage
const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || '';
  }
  return '';
};

// Check if API Key is configured
export const isApiKeyConfigured = (): boolean => {
  const key = getApiKey();
  return key.length > 0;
};

// Create AI client dynamically (to use updated API key)
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_NOT_CONFIGURED');
  }
  return new GoogleGenAI({ apiKey });
};

// Models
const TEXT_MODEL = "gemini-3-pro-preview";
const FAST_MODEL = "gemini-3-flash-preview";
const VISION_MODEL = "gemini-3-pro-preview";
const IMAGE_GEN_MODEL = "gemini-3-pro-image-preview"; // Maps to Nano Banana Pro

// --- 1. Intent Recognition ---
export const detectIntent = async (
  userInput: string,
  currentState: string
): Promise<IntentResult> => {
  const prompt = `
    Analyze the user input and current state to determine intent.
    User Input: ${userInput}
    Current State: ${currentState}
    
    Refer to the [Intent Recognition] section in the system prompt for possible intents.
    Return ONLY valid JSON.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return JSON.parse(cleanJson(text)) as IntentResult;
  } catch (error) {
    console.error("Error detecting intent:", error);
    throw error;
  }
};

// --- 2. Dynamic Options ---
// 工作流状态信息，用于更精确的选项生成
interface WorkflowStateInfo {
  step: string;
  hasProductRef: boolean;
  hasModelRef: boolean;
  hasScript: boolean;
  hasStoryboard: boolean;
  shotCount?: number;
}

export const generateDynamicOptions = async (
  context: string,
  workflowState: WorkflowStateInfo
): Promise<DynamicOption[]> => {
  // 构建详细的状态描述，让 AI 知道当前有什么素材
  const stateDescription = `
    Current Workflow Step: ${workflowState.step}
    Available Assets:
    - Product Reference Image: ${workflowState.hasProductRef ? 'YES (already uploaded)' : 'NO (not uploaded yet)'}
    - Model Reference Image: ${workflowState.hasModelRef ? 'YES (already uploaded)' : 'NO (not uploaded yet)'}
    - Script: ${workflowState.hasScript ? `YES (${workflowState.shotCount || 0} shots)` : 'NO (not created yet)'}
    - Storyboard Frames: ${workflowState.hasStoryboard ? 'YES (generated)' : 'NO (not generated yet)'}
  `;

  const prompt = `
    Generate dynamic options based on context and current workflow state.

    Context: ${context}

    ${stateDescription}

    IMPORTANT RULES:
    1. You MUST only use actions from the predefined list in the system prompt. Do NOT invent new actions.
    2. DO NOT suggest uploading/adding assets that already exist:
       - If Product Reference Image is YES, DO NOT suggest 'UPLOAD_PRODUCT_TRIGGER' or 'upload_product'
       - If Model Reference Image is YES, DO NOT suggest 'add_model', 'UPLOAD_MODEL_TRIGGER', or 'select_from_library'
    3. Suggest relevant next steps based on what's already available:
       - If both product and model refs exist but no script → suggest script options
       - If script exists but no storyboard → suggest generate storyboard
       - If storyboard exists → suggest export or edit options

    Refer to [Dynamic Options Generation] in system prompt.
    Return ONLY valid JSON.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: FAST_MODEL, // Fast model for UI responsiveness
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const result = JSON.parse(cleanJson(text));
    const options = result.options || [];

    // 验证并过滤无效的 action
    const validOptions = options.filter((opt: DynamicOption) => {
      if (VALID_ACTIONS.has(opt.action)) {
        return true;
      }
      console.warn(`Filtered out invalid action: ${opt.action} (label: ${opt.label})`);
      return false;
    });

    // 如果所有选项都被过滤掉了，返回一个默认选项
    if (validOptions.length === 0) {
      console.warn('All options were invalid, returning default options based on state');
      return getDefaultOptionsForState(workflowState);
    }

    return validOptions;
  } catch (error) {
    console.error("Error generating options:", error);
    throw error;
  }
};

// 根据当前工作流状态返回默认选项（并行入口模式，基于完整状态）
const getDefaultOptionsForState = (state: WorkflowStateInfo): DynamicOption[] => {
  const { step, hasProductRef, hasModelRef, hasScript, hasStoryboard } = state;

  // 分镜阶段
  if (hasStoryboard) {
    return [
      { label: '导出分镜', action: 'export' },
      { label: '修改脚本', action: 'edit_script' },
      { label: '全部重新生成', action: 'regenerate_all' }
    ];
  }

  // 脚本阶段
  if (hasScript) {
    return [
      { label: '生成分镜图', action: 'generate_storyboard' },
      { label: '修改脚本', action: 'edit_script' }
    ];
  }

  // 有产品和模特参考图，可以写脚本
  if (hasProductRef && hasModelRef) {
    return [
      { label: '让 AI 写脚本', action: 'generate_script' },
      { label: '上传脚本', action: 'upload_script' }
    ];
  }

  // 只有产品参考图
  if (hasProductRef && !hasModelRef) {
    return [
      { label: '添加模特', action: 'add_model' },
      { label: '从模特库选择', action: 'select_from_library' },
      { label: '直接写脚本', action: 'skip_to_script' }
    ];
  }

  // 只有模特参考图
  if (!hasProductRef && hasModelRef) {
    return [
      { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
      { label: '直接写脚本', action: 'skip_to_script' }
    ];
  }

  // 初始状态，没有任何参考图
  return [
    { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
    { label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' },
    { label: '从模特库选择', action: 'select_from_library' }
  ];
};

// --- 3. Chat Response ---
export const generateChatResponse = async (
  history: { role: string; content: string }[],
  userInput: string
): Promise<string> => {
    // Construct chat history properly for the SDK
    // The SDK expects roles 'user' and 'model'
    // But for a single turn generation with history we can just pass contents array
    // However, here we are using system instruction so we can just ask it to reply to the last message given the context
    // Ideally use ai.chats.create but for simplicity in this structure we'll use generateContent with context

    const contents = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: userInput }] });

    // Append specific instruction to override the general system prompt which contains JSON schemas
    const chatSpecificPrompt = SYSTEM_PROMPT + `

    [IMPORTANT OUTPUT RULE FOR CHAT]
    - You are strictly the chat bot communicating in natural language.
    - **DO NOT** output the JSON for dynamic options.
    - **DO NOT** output the JSON for intents.
    - **DO NOT** output HTML or code blocks.
    - ONLY output natural language text to the user.
    - If you want to suggest an action, just say it in words. The system will handle the buttons separately.
    `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: contents,
      config: {
        systemInstruction: chatSpecificPrompt,
      },
    });
    return response.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Error generating chat:", error);
    throw error;
  }
};

// --- 3b. Chat Response (Streaming) ---
export async function* generateChatResponseStream(
  history: { role: string; content: string }[],
  userInput: string
): AsyncGenerator<string, void, unknown> {
    const contents = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: userInput }] });

    const chatSpecificPrompt = SYSTEM_PROMPT + `

    [IMPORTANT OUTPUT RULE FOR CHAT]
    - You are strictly the chat bot communicating in natural language.
    - **DO NOT** output the JSON for dynamic options.
    - **DO NOT** output the JSON for intents.
    - **DO NOT** output HTML or code blocks.
    - ONLY output natural language text to the user.
    - If you want to suggest an action, just say it in words. The system will handle the buttons separately.
    `;

  try {
    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model: TEXT_MODEL,
      contents: contents,
      config: {
        systemInstruction: chatSpecificPrompt,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error generating streaming chat:", error);
    throw error;
  }
}


// --- 4. Vision Analysis ---
export const analyzeProductFeatures = async (base64Images: string[]): Promise<ProductFeatures> => {
    const parts = base64Images.map(b64 => ({
        inlineData: { mimeType: 'image/png', data: b64.split(',')[1] }
    }));
    
    // Add prompt - v3.15: 中文输出
    parts.push({
        // @ts-ignore
        text: "分析这些产品图片，按照 [产品特征分析] 系统提示词提取视觉特征。所有描述必须使用中文。返回 JSON。"
    });

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error("Analyze product error", e);
        throw e;
    }
}

export const analyzeModelFeatures = async (base64Images: string[]): Promise<ModelFeatures> => {
    const parts = base64Images.map(b64 => ({
        inlineData: { mimeType: 'image/png', data: b64.split(',')[1] }
    }));
    
    // v3.15: 中文输出
    parts.push({
        // @ts-ignore
        text: "分析这些模特图片，按照 [模特特征分析] 系统提示词提取视觉特征。所有描述必须使用中文。返回 JSON。"
    });

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error("Analyze model error", e);
        throw e;
    }
}

// --- 5. Image Generation (Reference Grids & Frames) ---
export const generateReferenceGrid = async (
  prompt: string,
  type: 'product' | 'model',
  referenceImages?: string[]  // base64 images to use as reference
): Promise<string> => {
  // Using gemini-3-pro-image-preview (Nano Banana Pro)
  // Pass reference images so AI can see the actual product/model

  try {
    const ai = getAI();

    // Build parts array: reference images first, then the prompt
    const parts: any[] = [];

    // Add reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      for (const img of referenceImages) {
        // Extract base64 data from data URL
        const base64Data = img.split(',')[1];
        const mimeType = img.match(/data:(.*?);/)?.[1] || 'image/png';
        parts.push({
          inlineData: { mimeType, data: base64Data }
        });
      }
    }

    // Add the text prompt
    parts.push({ text: prompt });

    // v3.10: 产品和模特参考图都使用 2.5:1 宽高比（Reference Sheet 布局）
    // 21:9 ≈ 2.33:1，接近 2.5:1
    const aspectRatio = (type === 'model' || type === 'product') ? '21:9' : '16:9';

    const response = await ai.models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: { parts },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
        }
      },
    });

    // Extract image
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part && part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return "";
  } catch (error) {
    console.error("Error generating reference grid:", error);
    throw error;
  }
};

export const generateStoryboardFrame = async (
  prompt: string,
  productRefImage?: string,
  modelRefImage?: string
): Promise<string> => {
    try {
      const ai = getAI();

      // Build parts array: reference images first for visual consistency, then the prompt
      const parts: any[] = [];

      // Add product reference image if provided
      if (productRefImage) {
        const base64Data = productRefImage.split(',')[1];
        const mimeType = productRefImage.match(/data:(.*?);/)?.[1] || 'image/png';
        parts.push({
          inlineData: { mimeType, data: base64Data }
        });
      }

      // Add model reference image if provided
      if (modelRefImage) {
        const base64Data = modelRefImage.split(',')[1];
        const mimeType = modelRefImage.match(/data:(.*?);/)?.[1] || 'image/png';
        parts.push({
          inlineData: { mimeType, data: base64Data }
        });
      }

      // Add enhanced prompt with reference instructions
      let enhancedPrompt = prompt;
      if (productRefImage || modelRefImage) {
        enhancedPrompt = `Based on the provided reference images, generate a storyboard frame that maintains visual consistency with them.\n\n${prompt}\n\nIMPORTANT: The generated image MUST maintain exact visual consistency with the reference images - same product appearance, colors, shapes, and if a model is shown, maintain the same person's appearance, skin tone, hair, and features.`;
      }
      parts.push({ text: enhancedPrompt });

      const response = await ai.models.generateContent({
        model: IMAGE_GEN_MODEL,
        contents: { parts },
        config: {
          imageConfig: {
              aspectRatio: "16:9",
              imageSize: "1K"
          }
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part && part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return "";
    } catch (error) {
      console.error("Error generating frame:", error);
      throw error;
    }
  };

// --- 6. Script Logic ---

// 视觉风格映射
const VISUAL_STYLE_MAP: Record<string, string> = {
  cinematic: '电影感大片风格 - 追求大银幕质感，注重光影氛围和构图美学',
  mv: 'MV潮流感风格 - 节奏明快，色彩大胆，适合年轻受众',
  documentary: '纪录片真实感风格 - 真实、接地气，强调情感共鸣',
  experimental: '实验艺术感风格 - 创意先行，打破常规，视觉冲击力强'
};

// 开场设计映射
const OPENING_DESIGN_MAP: Record<string, string> = {
  impact: '强视觉冲击开场 - 第一帧就要抓住眼球，大场景或特写冲击',
  suspense: '制造悬念开场 - 通过画面设置悬念，引发观众好奇心',
  emotion: '情绪共鸣开场 - 以情动人，快速建立情感连接',
  contrast: '反差对比开场 - 用对比制造冲突感和戏剧张力'
};

// 情绪曲线映射
const EMOTION_CURVE_MAP: Record<string, string> = {
  buildup: '渐入高潮 - 铺垫→发展→高潮→收尾，经典叙事结构',
  intense: '高开高走 - 全程高能，快节奏，密集信息量',
  steady: '平稳叙事 - 娓娓道来，情绪舒缓，适合高端质感',
  twist: '反转收尾 - 前段铺垫，结尾反转或升华，留下深刻印象'
};

// 时长映射
const DURATION_MAP: Record<string, string> = {
  '15s': '15秒 - 极致精简，3-5个镜头，核心信息一击即中',
  '30s': '30秒 - 标准TVC时长，6-10个镜头，完整起承转合',
  '60s': '60秒 - 品牌故事片，10-15个镜头，深度叙事空间'
};

// 基于引导问答的脚本生成（v3.2）
export const generateScriptWithGuide = async (
  guideAnswers: ScriptGuideAnswers,
  productInfo: string,
  hasModel: boolean
): Promise<Script> => {
    const visualStyleDesc = guideAnswers.visualStyle ? VISUAL_STYLE_MAP[guideAnswers.visualStyle] : '未指定';
    const openingDesc = guideAnswers.openingDesign ? OPENING_DESIGN_MAP[guideAnswers.openingDesign] : '未指定';
    const curveDesc = guideAnswers.emotionCurve ? EMOTION_CURVE_MAP[guideAnswers.emotionCurve] : '未指定';
    const durationDesc = guideAnswers.duration ? DURATION_MAP[guideAnswers.duration] : '30秒';

    const prompt = `
      基于以下艺术方向信息，生成一个专业的 TVC 广告脚本。

      【艺术方向】
      - 视觉风格：${visualStyleDesc}
      - 开场设计：${openingDesc}
      - 情绪曲线：${curveDesc}
      - 广告时长：${durationDesc}
      ${guideAnswers.signatureScene ? `- 标志性画面：${guideAnswers.signatureScene}` : ''}
      ${guideAnswers.referenceStyle ? `- 参考风格：${guideAnswers.referenceStyle}` : ''}

      【产品信息】
      ${productInfo}

      【是否有模特】
      ${hasModel ? '有模特出镜，需安排模特镜头' : '无模特，纯产品展示'}

      【输出要求】
      返回 JSON 格式：
      {
        "productInfo": "产品描述",
        "shots": [
          {
            "shotNumber": 1,
            "description": "画面描述（场景环境、人物/产品动作、视觉元素）",
            "duration": "时长（秒）",
            "shotType": "景别（特写/近景/中景/全景/远景）",
            "cameraMove": "镜头运动（推/拉/摇/移/跟/固定）",
            "dialogue": "台词/旁白（如有）"
          }
        ]
      }

      【重要】
      1. 严格按照所选的视觉风格和情绪曲线来设计镜头
      2. 开场镜头必须符合所选的开场设计策略
      3. 如果有标志性画面要求，必须在脚本中体现
      4. 镜头数量和节奏要匹配所选的时长
      5. 每个镜头描述要具体、可视化，便于后续生成分镜图
      6. **TVC 分镜黄金规则**（v3.17）：每个镜头的画面设计必须遵循以下 9 条规则之一，根据脚本内容自动选择最合适的规则：
         - Hero Still Life：标志性产品静物，大胆构图，产品作为视觉中心
         - Extreme Macro：极致微距特写，凸显材质、表面纹理、工艺细节
         - Dynamic Interaction：动态液体/粒子与产品的互动，增强视觉冲击力
         - Minimal Sculptural：极简雕塑感陈列，搭配抽象几何形态
         - Floating Elements：悬浮元素构图，传达轻盈感与创新感
         - Sensory Close-up：感官特写，强调触感与真实感
         - Color-driven Scene：色彩驱动的概念场景，呼应产品色调
         - Ingredient Abstraction：成分/元素的抽象表达（非写实、符号化）
         - Surreal Fusion：超现实与优雅的融合，虚实结合的想象空间
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error(e);
        throw e;
    }
}

// 原有的简单脚本生成（兼容）- v3.15: 中文输出, v3.17: TVC黄金规则
export const generateScript = async (description: string, productInfo: string, hasModel: boolean): Promise<Script> => {
    const prompt = `
      生成一个 TVC 广告脚本。
      用户描述：${description}
      产品信息：${productInfo}
      是否有模特：${hasModel ? '是' : '否'}
      参考系统提示词中的 [脚本生成] 部分。
      所有描述必须使用中文。
      每个镜头必须遵循 TVC 分镜黄金规则之一（Hero Still Life / Extreme Macro / Dynamic Interaction / Minimal Sculptural / Floating Elements / Sensory Close-up / Color-driven Scene / Ingredient Abstraction / Surreal Fusion）。
      返回 JSON。
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error(e);
        throw e;
    }
}

// v3.15: 中文输出
export const parseScript = async (rawScript: string): Promise<Script> => {
    const prompt = `
      将这个原始脚本解析为标准 JSON 格式。
      原始脚本：${rawScript}
      参考系统提示词中的 [脚本解析] 部分。
      所有描述必须使用中文。如果原始脚本是英文，需翻译为中文。
      返回 JSON。
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error(e);
        throw e;
    }
}

// --- 6b. Script Modification ---
export const modifyScript = async (
    currentScript: Script,
    modificationRequest: string,
    conversationContext: string
): Promise<{ script: Script; summary: string }> => {
    const prompt = `
      你是一个专业的 TVC 广告脚本编辑器。

      【当前脚本】：
      ${JSON.stringify(currentScript, null, 2)}

      【对话上下文】（包含用户的修改请求和之前的讨论）：
      ${conversationContext}

      【用户最新输入】：
      ${modificationRequest}

      【任务】：
      根据对话上下文和用户的修改请求，执行脚本修改。

      【修改类型判断】：
      1. 如果用户说"好的"、"更新吧"、"确认"等确认性语句，检查上下文中是否有之前提出的修改方案，如果有则执行该方案
      2. 如果用户明确说要增加镜头，在指定位置插入新镜头
      3. 如果用户说要删除镜头，移除指定镜头
      4. 如果用户说要修改某个镜头，更新该镜头的内容
      5. 如果用户说要调整顺序，重新排列镜头

      【输出要求】：
      返回 JSON 格式：
      {
        "script": {
          "productInfo": "产品描述",
          "shots": [
            {
              "shotNumber": 1,
              "description": "画面描述",
              "duration": "时长",
              "shotType": "景别",
              "cameraMove": "镜头运动",
              "dialogue": "台词/旁白"
            }
          ]
        },
        "summary": "修改摘要（简述做了什么修改，如：在开场前增加了城市空镜，在中段增加了街头行走，在结尾前增加了金属特写，共新增3个镜头）"
      }

      【重要】：
      1. shotNumber 必须从 1 开始连续编号
      2. 保留未修改镜头的原有内容
      3. 新增镜头要有完整的 description、duration、shotType、cameraMove 字段
      4. summary 要清晰说明做了什么修改
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        const result = JSON.parse(cleanJson(response.text || "{}"));
        return {
            script: result.script || currentScript,
            summary: result.summary || "脚本已更新"
        };
    } catch (e) {
        console.error("Error modifying script:", e);
        throw e;
    }
}

// --- 7. Prompt Generation --- v3.15: 中文输出
export const generateShotPrompt = async (
    shotDesc: string,
    shotType: string,
    cameraMove: string,
    productFeatures: ProductFeatures,
    modelFeatures?: ModelFeatures
): Promise<string> => {
    const prompt = `
      为这个镜头生成详细的图像生成提示词。
      镜头：${shotDesc}，景别：${shotType}，运镜：${cameraMove}
      产品特征：${JSON.stringify(productFeatures)}
      模特特征：${modelFeatures ? JSON.stringify(modelFeatures) : '无'}
      参考系统提示词中的 [画面提示词生成] 部分。
      输出语言：中文描述。
      仅返回提示词字符串。
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
            }
        });
        return response.text || "";
    } catch (e) {
        console.error(e);
        throw e;
    }
}

// --- 8. Script Analysis (v3.2) ---
export const analyzeScript = async (script: Script): Promise<ScriptAnalysis> => {
    const prompt = `
      你是一位专业的 TVC 广告脚本评审专家。请对以下脚本进行专业评估。

      【脚本内容】
      ${JSON.stringify(script, null, 2)}

      【评估维度】
      请从以下四个维度进行评分（1-5星）：

      1. **开场冲击力**：前3秒是否抓人？开场镜头是否有足够的视觉冲击或情绪钩子？
         - 5星：开场极具冲击力，令人过目不忘
         - 4星：开场有吸引力，能抓住注意力
         - 3星：开场中规中矩
         - 2星：开场较弱，容易被划走
         - 1星：开场无亮点

      2. **镜头语言丰富度**：景别变化是否丰富？运镜是否有层次感？
         - 5星：景别、运镜变化丰富，电影级镜头语言
         - 4星：有不错的镜头语言变化
         - 3星：基本够用
         - 2星：镜头语言单调
         - 1星：几乎没有镜头语言变化

      3. **节奏张力**：是否有起伏、高潮、呼吸感？节奏是否引人入胜？
         - 5星：节奏张弛有度，情绪层次分明
         - 4星：节奏处理得当
         - 3星：节奏平稳但缺乏张力
         - 2星：节奏拖沓或过于急促
         - 1星：节奏混乱

      4. **视觉记忆点**：有没有过目不忘的画面？有没有"名场面"潜力？
         - 5星：有多个令人过目不忘的画面
         - 4星：有1-2个亮眼画面
         - 3星：画面尚可但不突出
         - 2星：缺乏记忆点
         - 1星：完全没有记忆点

      【输出要求】
      返回 JSON 格式：
      {
        "basicInfo": {
          "shotCount": 镜头数量,
          "estimatedDuration": "预估时长",
          "styleJudgment": "风格判断（如：电影感/MV风/纪录片风等）"
        },
        "scores": {
          "openingImpact": 1-5,
          "shotLanguage": 1-5,
          "rhythmTension": 1-5,
          "visualMemory": 1-5
        },
        "highlights": [
          "亮点1",
          "亮点2"
        ],
        "suggestions": [
          "提升建议1",
          "提升建议2"
        ]
      }

      【重要】
      - 评分要客观、专业
      - 亮点和建议要具体、可操作
      - 建议不超过3条，聚焦最重要的改进点
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error("Error analyzing script:", e);
        throw e;
    }
}

// --- 9. Script Optimization (v3.2) ---
export const optimizeScript = async (
    script: Script,
    analysis: ScriptAnalysis
): Promise<Script> => {
    const prompt = `
      基于以下脚本分析报告，对脚本进行优化。

      【当前脚本】
      ${JSON.stringify(script, null, 2)}

      【分析报告】
      ${JSON.stringify(analysis, null, 2)}

      【优化任务】
      针对分析报告中的建议，对脚本进行优化：
      ${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

      【输出要求】
      返回优化后的脚本，JSON 格式：
      {
        "productInfo": "产品描述",
        "shots": [
          {
            "shotNumber": 1,
            "description": "画面描述",
            "duration": "时长",
            "shotType": "景别",
            "cameraMove": "镜头运动",
            "dialogue": "台词/旁白"
          }
        ]
      }

      【重要】
      1. 保留脚本的整体结构和核心内容
      2. 针对性地改进低分维度
      3. 增强视觉记忆点和节奏张力
      4. shotNumber 从 1 开始连续编号
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        console.error("Error optimizing script:", e);
        throw e;
    }
}
