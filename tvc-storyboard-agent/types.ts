export interface ProductFeatures {
  shape: string;
  colors: string[];
  material: string;
  proportions: string;
  details: string[];
  style: string;
}

export interface ModelFeatures {
  face: {
    shape: string;
    features: string;
    skinTone: string;
  };
  hair: {
    length: string;
    color: string;
    style: string;
  };
  body: {
    type: string;
    proportions: string;
  };
  vibe: string;
  ageRange: string;
}

export interface Shot {
  shotNumber: number;
  description: string;
  duration: string;
  shotType: string;
  cameraMove: string;
  dialogue?: string;
  prompt?: string; // Generated prompt for the image
  imageUrl?: string; // Generated image URL
  isGenerating?: boolean;
}

export interface Script {
  productInfo: string;
  shots: Shot[];
}

export interface WorkflowState {
  step: 'start' | 'product_ref' | 'model_ref' | 'script' | 'storyboard';
  productImages: string[]; // Base64 strings
  productFeatures?: ProductFeatures;
  productRefImage?: string; // URL/Base64 of the generated grid

  hasModel: boolean;
  modelImages: string[];
  modelFeatures?: ModelFeatures;
  modelRefImage?: string;

  script?: Script;

  // 并行入口：记录用户的入口路径
  entryPath?: 'product' | 'model_library' | 'model_upload'; // 用户从哪个入口开始

  // 暂存字段：用户跳步骤时暂存内容
  pendingModelImages?: string[]; // 用户先发模特图时暂存
  pendingScriptContent?: string; // 用户先发脚本时暂存

  // v3.9: 重新上传素材标记
  pendingReupload?: 'product' | 'model'; // 用户表达要换产品/模特时设置，上传后清除
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // Base64
  timestamp: number;
  isStreaming?: boolean; // 是否正在流式输出
}

export interface DynamicOption {
  label: string;
  action: string;
  params?: any;
}

export interface IntentResult {
  intent: string;
  params: any;
  confidence: number;
}

// 模特库
export interface SavedModel {
  id: string;
  name: string;
  refImage: string;       // 2x3 宫格图 base64
  features: ModelFeatures;
  createdAt: number;
}

// 脚本创作引导问答答案
export interface ScriptGuideAnswers {
  visualStyle?: 'cinematic' | 'mv' | 'documentary' | 'experimental';
  openingDesign?: 'impact' | 'suspense' | 'emotion' | 'contrast';
  emotionCurve?: 'buildup' | 'intense' | 'steady' | 'twist';
  signatureScene?: string;
  duration?: '15s' | '30s' | '60s';
  referenceStyle?: string;
}

// 脚本分析报告
export interface ScriptAnalysis {
  basicInfo: {
    shotCount: number;
    estimatedDuration: string;
    styleJudgment: string;
  };
  scores: {
    openingImpact: number;      // 1-5 开场冲击力
    shotLanguage: number;       // 1-5 镜头语言丰富度
    rhythmTension: number;      // 1-5 节奏张力
    visualMemory: number;       // 1-5 视觉记忆点
  };
  highlights: string[];         // 亮点
  suggestions: string[];        // 提升建议
}
