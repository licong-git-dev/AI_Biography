import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import Sidebar from './components/Sidebar';
import Home, { Project } from './components/Home';
import ChatPanel from './components/ChatPanel';
import Canvas from './components/Canvas';
import ModelLibrary from './components/ModelLibrary';
import ApiKeyModal from './components/ApiKeyModal';
import FrameEditModal from './components/FrameEditModal';
import ShotEditModal from './components/ShotEditModal';
import { Message, WorkflowState, DynamicOption, ProductFeatures, ModelFeatures, Script, Shot, SavedModel, ScriptGuideAnswers, ScriptAnalysis } from './types';
import * as gemini from './services/geminiService';
import * as storage from './services/storageService';

// Types
type ViewType = 'home' | 'project' | 'models';

interface ProjectData extends Project {
  workflow: WorkflowState;
  messages: Message[];
}

// Initial State
const initialWorkflow: WorkflowState = {
  step: 'start',
  productImages: [],
  hasModel: false,
  modelImages: [],
};

const initialMessages: Message[] = [
  {
    id: 'init',
    role: 'assistant',
    content: "嘿，你好啊创作者！我是你的 TVC 分镜策划师。\n\n咱们先收集参考素材——上传产品图、上传模特图、或者从模特库选一个已有的模特，都可以作为起点。",
    timestamp: Date.now()
  }
];

const App: React.FC = () => {
  // View State
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);

  // Project State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [options, setOptions] = useState<DynamicOption[]>([
    { label: "上传产品图", action: "UPLOAD_PRODUCT_TRIGGER" },
    { label: "上传模特图", action: "UPLOAD_MODEL_TRIGGER" },
    { label: "从模特库选择", action: "select_from_library" }
  ]);
  const [workflow, setWorkflow] = useState<WorkflowState>(initialWorkflow);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // v3.11: 分镜图生成控制
  const [isStoryboardGenerating, setIsStoryboardGenerating] = useState(false);
  const storyboardAbortRef = useRef(false);
  const [frameEditModal, setFrameEditModal] = useState<{
    isOpen: boolean;
    shot: Shot | null;
    shotIndex: number;
    isRegenerating: boolean;
  }>({
    isOpen: false,
    shot: null,
    shotIndex: -1,
    isRegenerating: false,
  });
  const [shotEditModal, setShotEditModal] = useState<{
    isOpen: boolean;
    shot: Shot | null;
    shotIndex: number;
  }>({
    isOpen: false,
    shot: null,
    shotIndex: -1,
  });

  // v3.2 脚本创作引导问答状态
  const [scriptGuideStep, setScriptGuideStep] = useState<number>(0); // 0=未开始, 1-6=问题步骤, 7=确认
  const [scriptGuideAnswers, setScriptGuideAnswers] = useState<ScriptGuideAnswers>({});

  // v3.2 脚本分析状态
  const [scriptAnalysis, setScriptAnalysis] = useState<ScriptAnalysis | null>(null);
  const [isAnalyzingScript, setIsAnalyzingScript] = useState(false);

  // 模特库展开状态（用于 ChatPanel 内嵌模特库）
  const [isModelsExpanded, setIsModelsExpanded] = useState(false);

  // 素材变更等待确认状态
  const [pendingMaterialChange, setPendingMaterialChange] = useState<{
    type: 'product' | 'model';
    confirmed: boolean;
  } | null>(null);

  // 用于防抖保存的 ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chat Panel 宽度状态
  const [chatPanelWidth, setChatPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_panel_width');
      return saved ? parseInt(saved, 10) : 420;
    }
    return 420;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Load projects and models on mount
  useEffect(() => {
    const initializeApp = async () => {
      // 先尝试从 localStorage 迁移旧数据
      await storage.migrateFromLocalStorage();

      // 加载项目
      const loadedProjects = await storage.loadAllProjects();
      setProjects(loadedProjects);

      // 加载模特库
      const loadedModels = await storage.loadAllModels();
      setSavedModels(loadedModels);

      // Check if there's a current project
      const savedCurrentId = storage.getCurrentProjectId();
      if (savedCurrentId) {
        const project = loadedProjects.find((p: ProjectData) => p.id === savedCurrentId);
        if (project) {
          openProject(project);
        }
      }
    };

    initializeApp();
  }, []);

  // Auto-save current project (with debounce)
  useEffect(() => {
    if (currentProjectId && workflow.step !== 'start') {
      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 防抖保存，避免频繁写入
      saveTimeoutRef.current = setTimeout(async () => {
        const projectIndex = projects.findIndex(p => p.id === currentProjectId);
        if (projectIndex >= 0) {
          const updatedProject = {
            ...projects[projectIndex],
            workflow,
            messages,
            updatedAt: Date.now(),
            coverImage: workflow.productRefImage || workflow.script?.shots[0]?.imageUrl,
          };

          // 更新本地状态
          const updatedProjects = [...projects];
          updatedProjects[projectIndex] = updatedProject;
          setProjects(updatedProjects);

          // 保存到 IndexedDB
          await storage.saveProject(updatedProject);
        }
      }, 500); // 500ms 防抖
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workflow, messages]);

  // Chat Panel 拖拽调整宽度
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startWidth: chatPanelWidth };
  }, [chatPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;

      const delta = e.clientX - resizeRef.current.startX;
      const newWidth = resizeRef.current.startWidth + delta;

      // 限制宽度范围：最小 320px，最大 50% 屏幕宽度
      const minWidth = 320;
      const maxWidth = window.innerWidth * 0.5;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      setChatPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        resizeRef.current = null;
        // 保存到 localStorage
        localStorage.setItem('chat_panel_width', chatPanelWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, chatPanelWidth]);

  // 获取当前项目名
  const getCurrentProjectName = (): string => {
    if (currentProjectId) {
      const project = projects.find(p => p.id === currentProjectId);
      return project?.name || 'Untitled Project';
    }
    return 'Untitled Project';
  };

  // 更新项目名
  const handleProjectNameChange = async (newName: string) => {
    if (!currentProjectId) return;

    const projectIndex = projects.findIndex(p => p.id === currentProjectId);
    if (projectIndex >= 0) {
      const updatedProject = {
        ...projects[projectIndex],
        name: newName,
        updatedAt: Date.now(),
      };

      const updatedProjects = [...projects];
      updatedProjects[projectIndex] = updatedProject;
      setProjects(updatedProjects);

      await storage.saveProject(updatedProject);
    }
  };

  // --- Model Library Management ---
  const handleModelSelect = (model: SavedModel) => {
    // 选中模特后，应用到当前项目
    if (currentProjectId) {
      updateWorkflow({
        hasModel: true,
        modelRefImage: model.refImage,
        modelFeatures: model.features,
        entryPath: workflow.entryPath || 'model_library',
        step: 'model_ref'
      });
      addMessage('assistant', `已选择模特「${model.name}」，参考图已应用。`);

      // 如果没有产品参考图，追问是否需要
      if (!workflow.productRefImage) {
        addMessage('assistant', '需要上传产品图吗？还是直接进入脚本阶段？');
        setOptions([
          { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
          { label: '直接写脚本', action: 'skip_to_script' }
        ]);
      } else {
        // 已有产品图，直接进入脚本阶段
        addMessage('assistant', '产品和模特参考图都齐了，可以开始脚本了。');
        setOptions([
          { label: '让 AI 写脚本', action: 'generate_script' },
          { label: '上传脚本', action: 'upload_script' }
        ]);
      }
      setCurrentView('project');
    } else {
      // 如果没有当前项目，创建一个新项目
      createNewProject().then(() => {
        updateWorkflow({
          hasModel: true,
          modelRefImage: model.refImage,
          modelFeatures: model.features,
          entryPath: 'model_library',
          step: 'model_ref'
        });
        addMessage('assistant', `已选择模特「${model.name}」，参考图已应用。`);
        addMessage('assistant', '需要上传产品图吗？还是直接进入脚本阶段？');
        setOptions([
          { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
          { label: '直接写脚本', action: 'skip_to_script' }
        ]);
      });
    }
  };

  const handleModelDelete = async (modelId: string) => {
    await storage.deleteModel(modelId);
    setSavedModels(prev => prev.filter(m => m.id !== modelId));
  };

  const handleModelRename = async (modelId: string, newName: string) => {
    await storage.updateModel(modelId, { name: newName });
    setSavedModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, name: newName } : m
    ));
  };

  const handleSaveModelToLibrary = async (model: SavedModel) => {
    await storage.saveModel(model);
    setSavedModels(prev => [model, ...prev]);
    addMessage('assistant', `模特「${model.name}」已保存到模特库。`);
  };

  // --- Project Management ---
  const createNewProject = async () => {
    const newProject: ProjectData = {
      id: `project_${Date.now()}`,
      name: 'Untitled Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workflow: initialWorkflow,
      messages: initialMessages,
    };

    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    await storage.saveProject(newProject);

    openProject(newProject);
  };

  const openProject = (project: ProjectData) => {
    setCurrentProjectId(project.id);

    // v3.11: 加载项目时清理 isGenerating 状态（刷新/重新打开时不可能有正在进行的生成）
    let cleanedWorkflow = project.workflow;
    if (cleanedWorkflow.script?.shots) {
      const cleanedShots = cleanedWorkflow.script.shots.map(shot => ({
        ...shot,
        isGenerating: false
      }));
      cleanedWorkflow = {
        ...cleanedWorkflow,
        script: { ...cleanedWorkflow.script, shots: cleanedShots }
      };
    }

    setWorkflow(cleanedWorkflow);
    setMessages(project.messages);
    // 根据项目状态设置合适的选项
    if (project.workflow.step === 'start') {
      setOptions([
        { label: "上传产品图", action: "UPLOAD_PRODUCT_TRIGGER" },
        { label: "上传模特图", action: "UPLOAD_MODEL_TRIGGER" },
        { label: "从模特库选择", action: "select_from_library" }
      ]);
    } else {
      setOptions([{ label: "上传产品图", action: "UPLOAD_PRODUCT_TRIGGER" }]);
    }
    setCurrentView('project');
    storage.saveCurrentProjectId(project.id);
  };

  const deleteProject = async (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    await storage.deleteProject(projectId);

    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setWorkflow(initialWorkflow);
      setMessages(initialMessages);
      storage.saveCurrentProjectId(null);
    }
  };

  const handleNavigate = (view: ViewType) => {
    if (view === 'project' && !currentProjectId) {
      // If no current project, create one
      createNewProject();
    } else if (view === 'models') {
      // 刷新模特库数据
      storage.loadAllModels().then(models => {
        setSavedModels(models);
      });
      setCurrentView(view);
    } else {
      setCurrentView(view);
    }
  };

  // --- Helpers ---
  const addMessage = (role: 'user' | 'assistant', content: string, images?: string[], isStreaming?: boolean) => {
    const id = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, {
      id,
      role,
      content,
      images,
      timestamp: Date.now(),
      isStreaming
    }]);
    return id;
  };

  const updateMessageById = (id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const updateWorkflow = (updates: Partial<WorkflowState>) => {
    setWorkflow(prev => ({ ...prev, ...updates }));
  };

  const setLoading = (loading: boolean) => setIsProcessing(loading);

  const checkApiKeyAndPrompt = (): boolean => {
    if (!gemini.isApiKeyConfigured()) {
      addMessage('assistant', '检测到还没有配置 API Key，点击左下角设置图标配置后即可使用。');
      setOptions([{ label: '去配置', action: 'open_settings' }]);
      return false;
    }
    return true;
  };

  const handleApiError = (error: any): boolean => {
    if (error?.message === 'API_KEY_NOT_CONFIGURED') {
      addMessage('assistant', '检测到还没有配置 API Key，点击左下角设置图标配置后即可使用。');
      setOptions([{ label: '去配置', action: 'open_settings' }]);
      return true;
    }
    return false;
  };

  // --- 流程控制：并行入口检查 ---
  const hasProductRef = (): boolean => {
    return !!workflow.productRefImage;
  };

  const hasModelRef = (): boolean => {
    return !!workflow.modelRefImage;
  };

  // 检查是否有任意参考图（产品或模特）
  const hasAnyRef = (): boolean => {
    return hasProductRef() || hasModelRef();
  };

  const hasScript = (): boolean => {
    return !!workflow.script;
  };

  // 检查是否已生成分镜图
  const hasStoryboard = (): boolean => {
    return workflow.step === 'storyboard' &&
           workflow.script?.shots?.some(shot => shot.imageUrl);
  };

  // 构建完整的工作流状态信息，用于 AI 生成动态选项
  const getWorkflowStateInfo = () => ({
    step: workflow.step,
    hasProductRef: !!workflow.productRefImage,
    hasModelRef: !!workflow.modelRefImage,
    hasScript: !!workflow.script,
    hasStoryboard: hasStoryboard(),
    shotCount: workflow.script?.shots?.length || 0,
  });

  // 检测哪些帧包含模特相关描述
  const detectModelFrames = (): number[] => {
    if (!workflow.script?.shots) return [];
    const modelKeywords = ['模特', '人物', '女性', '男性', '她', '他', '演员', '主角', '人', 'model', 'person', 'woman', 'man', 'she', 'he'];
    return workflow.script.shots
      .filter(shot => {
        const desc = (shot.description || '').toLowerCase();
        return modelKeywords.some(kw => desc.includes(kw.toLowerCase()));
      })
      .map(shot => shot.shotNumber);
  };

  // 检查是否可以进行某个操作
  const canProceedTo = (targetStep: string): { allowed: boolean; message?: string } => {
    switch (targetStep) {
      case 'script':
        // 至少需要一个参考图才能进入脚本阶段
        if (!hasAnyRef()) {
          return {
            allowed: false,
            message: '写脚本需要至少一个参考图（产品或模特）才能保持视觉一致性。先上传产品图或选择模特吧。'
          };
        }
        return { allowed: true };
      case 'storyboard':
        if (!hasAnyRef()) {
          return {
            allowed: false,
            message: '分镜需要参考图才能保持视觉一致性。先上传产品图或选择模特吧。'
          };
        }
        if (!hasScript()) {
          return {
            allowed: false,
            message: '分镜图需要脚本作为基础。请先提供广告脚本，或者告诉我你的创意，我来帮你写。'
          };
        }
        return { allowed: true };
      default:
        return { allowed: true };
    }
  };

  // 处理用户跳步骤的拦截（并行入口模式）
  const handleSkipStepIntercept = (intent: string, images?: string[], text?: string): boolean => {
    // 用户在没有任何参考图时发送脚本或想生成脚本
    if ((intent === 'UPLOAD_SCRIPT' || intent === 'GENERATE_SCRIPT') && !hasAnyRef()) {
      // 暂存脚本内容
      if (text) {
        updateWorkflow({ pendingScriptContent: text });
      }
      addMessage('assistant', '脚本收到了，先存着。\n\n不过分镜需要参考图才能保持视觉一致——上传产品图或选择模特，然后马上处理脚本。');
      setOptions([
        { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
        { label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' },
        { label: '从模特库选择', action: 'select_from_library' }
      ]);
      return true;
    }

    // 用户在没有任何参考图时直接要求生成分镜
    if (intent === 'GENERATE_STORYBOARD' && !hasAnyRef()) {
      addMessage('assistant', '分镜需要参考图才能保持视觉一致性。先上传产品图或选择模特吧。');
      setOptions([
        { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
        { label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' },
        { label: '从模特库选择', action: 'select_from_library' }
      ]);
      return true;
    }

    return false;
  };

  // 根据当前阶段过滤选项（并行入口模式）
  const filterOptionsByStep = (options: DynamicOption[]): DynamicOption[] => {
    if (!hasAnyRef()) {
      // 没有任何参考图时，只保留上传参考图的选项
      return options.filter(opt =>
        opt.action === 'UPLOAD_PRODUCT_TRIGGER' ||
        opt.action === 'UPLOAD_MODEL_TRIGGER' ||
        opt.action === 'upload_product' ||
        opt.action === 'select_from_library' ||
        opt.action === 'open_settings'
      );
    }
    if (!hasScript()) {
      // 有参考图但没脚本时，不提供生成分镜选项
      return options.filter(opt =>
        opt.action !== 'generate_storyboard' &&
        opt.action !== 'GENERATE_STORYBOARD'
      );
    }
    return options;
  };

  // --- Logic Flows ---
  const handleProductUpload = async (files: File[]) => {
    if (!checkApiKeyAndPrompt()) return;

    setLoading(true);
    const base64Images = await Promise.all(files.map(fileToBase64));

    addMessage('user', '上传了产品图片', base64Images);
    updateWorkflow({
      productImages: base64Images,
      step: 'product_ref',
      entryPath: workflow.entryPath || 'product'
    });

    try {
      addMessage('assistant', '正在分析产品特征...');
      const features = await gemini.analyzeProductFeatures(base64Images);
      updateWorkflow({ productFeatures: features });

      addMessage('assistant', `识别到产品特征：${features.style} 风格，${features.colors.join(', ')} 配色。正在生成标准参考图...`);

      // v3.10: Product Reference Sheet 布局（与模特参考图保持一致）
      const prompt = `
【重要】请仔细查看我上传的产品参考图片，然后生成这个【完全相同的产品】的专业 Product Reference Sheet。

⚠️ 核心要求：生成的必须是【图片中这个具体产品】的不同角度，不是类似产品，不是同品类产品，是【这一个产品】。

【从参考图中观察到的产品特征】
- 形状轮廓：${features.shape}
- 配色方案：${features.colors.join('、')}
- 材质质感：${features.material}
- 设计风格：${features.style}
- 细节特征：${features.details?.join('、') || '保持参考图中的所有细节'}

【整体布局】宽长方形，宽高比约 2.5:1，填满整个画布，不要留黑边
- 左侧 1/4：主形象（完整产品图，最佳展示角度）
- 右侧 3/4：Design Sheet（4 个视图横排）

【左侧主形象要求】
- 完整产品图，选择最能代表产品的角度
- 对于有正面概念的产品（如包装盒、饮料瓶）：展示 logo/品牌面
- 对于无明确正面的产品（如耳机、配件）：展示 45 度经典角度

【右侧 Design Sheet 要求】
- 4 个视图横排：正面 → 侧面 → 背面 → 45度斜侧/细节特写
- 最后一个位置根据产品特性判断：
  • 有明显多面特征的产品：45度斜侧
  • 有细节亮点的产品（logo、纹理、功能部件）：细节特写

【严格要求】
1. 填满整个画布，左右上下不要留黑边或空白
2. 产品形状必须与参考图完全一致
3. 产品图案/纹理必须与参考图完全一致
4. 产品颜色必须与参考图完全一致
5. 产品比例必须与参考图完全一致
6. 纯白色或浅灰色背景
7. 统一的柔和产品摄影光效
8. 不需要任何文字标注、引线或说明
      `.trim();

      const gridImage = await gemini.generateReferenceGrid(prompt, 'product', base64Images);
      updateWorkflow({ productRefImage: gridImage });

      addMessage('assistant', '产品参考图已生成！6 个标准角度都在这张图里了。');

      // 检查是否有暂存的模特图
      if (workflow.pendingModelImages && workflow.pendingModelImages.length > 0) {
        addMessage('assistant', '之前收到的模特图现在可以处理了。');
        // 清除暂存并处理模特图
        const pendingImages = workflow.pendingModelImages;
        updateWorkflow({ pendingModelImages: undefined });
        // 模拟文件对象进行处理
        setLoading(false);
        await handleModelUploadFromBase64(pendingImages);
        return;
      }

      // 检查是否有暂存的脚本内容
      if (workflow.pendingScriptContent) {
        addMessage('assistant', '之前收到的脚本内容现在可以处理了。你想先添加模特，还是直接处理脚本？');
        setOptions([
          { label: '先添加模特', action: 'add_model' },
          { label: '从模特库选择', action: 'select_from_library' },
          { label: '直接处理脚本', action: 'process_pending_script' }
        ]);
      } else if (workflow.modelRefImage) {
        // 已经有模特参考图了，直接进入脚本阶段
        addMessage('assistant', '产品和模特参考图都齐了，可以开始脚本了。');
        setOptions([
          { label: '让 AI 写脚本', action: 'generate_script' },
          { label: '上传脚本', action: 'upload_script' }
        ]);
      } else {
        // 追问是否需要模特
        addMessage('assistant', '需要添加模特吗？');
        setOptions([
          { label: '添加模特', action: 'add_model' },
          { label: '从模特库选择', action: 'select_from_library' },
          { label: '直接写脚本', action: 'skip_to_script' }
        ]);
      }

    } catch (e: any) {
      if (!handleApiError(e)) {
        addMessage('assistant', '处理产品图时出错了，请重试。');
      }
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 处理已经是 base64 格式的模特图（用于暂存恢复）
  const handleModelUploadFromBase64 = async (base64Images: string[]) => {
    if (!checkApiKeyAndPrompt()) return;

    setLoading(true);
    addMessage('user', '处理之前暂存的模特图片', base64Images);
    await processModelImages(base64Images);
  };

  // 核心模特图处理逻辑
  const processModelImages = async (base64Images: string[]) => {
    updateWorkflow({
      modelImages: base64Images,
      step: 'model_ref',
      hasModel: true,
      entryPath: workflow.entryPath || 'model_upload'
    });

    try {
      addMessage('assistant', '正在分析模特特征...');
      const features = await gemini.analyzeModelFeatures(base64Images);
      updateWorkflow({ modelFeatures: features });

      addMessage('assistant', `识别到模特特征：${features.vibe} 气质。正在生成标准视图...`);

      // v3.8.1: Character Reference Sheet 布局（移除标注、明确半身照、填满画布）
      const prompt = `
【重要】请仔细查看我上传的模特参考图片，然后生成【这位模特】的专业 Character Reference Sheet。

⚠️ 核心要求：生成的必须是【图片中这位模特本人】，不是相似的人，是【这一位模特】。

【从参考图中观察到的模特特征】
- 脸型：${features.face?.shape || '标准'}
- 五官特征：${features.face?.features || '精致'}
- 肤色：${features.face?.skinTone || '自然'}
- 发型：${features.hair?.style || '自然'}
- 发色：${features.hair?.color || '黑色'}
- 发长：${features.hair?.length || '中长'}
- 体型：${features.body?.type || '匀称'}
- 气质：${features.vibe}

【整体布局】宽长方形，宽高比约 2.5:1，填满整个画布，不要留黑边
- 左侧 1/4：主形象（正面半身照，从胸部到头顶完整呈现，不是脸部特写大头照）
- 右侧 3/4：Design Sheet（4 个全身视角横排）

【左侧主形象要求】
- 必须是「半身照」：从胸部到头顶，能看到肩膀和上半身轮廓
- 不是「大头照」：不要只拍脸部特写
- 用于快速识别模特的整体形象

【右侧 Design Sheet 内容】
视角横排（从左到右）：
1. 正面全身
2. 右侧全身
3. 背面全身
4. 45度斜侧全身

【严格要求】
1. 填满整个画布，左右上下不要留黑边或空白
2. 模特面部特征必须与参考图完全一致（五官轮廓、眼睛形状、鼻子、嘴唇）
3. 模特发型和发色必须与参考图完全一致
4. 模特肤色和身材比例必须与参考图完全一致
5. 模特气质必须与参考图完全一致（${features.vibe}）
6. 服装统一为简洁的中性色（白T恤+牛仔裤或类似）
7. 纯白色或浅灰色背景
8. 统一的柔和人像摄影光效
9. 表情自然放松
10. 真人照片风格，专业角色设计表排版
11. 不需要任何文字标注、引线或说明
      `.trim();

      const gridImage = await gemini.generateReferenceGrid(prompt, 'model', base64Images);
      updateWorkflow({ modelRefImage: gridImage });

      addMessage('assistant', '模特参考图已生成！');

      // 检查是否有暂存的脚本内容
      if (workflow.pendingScriptContent) {
        addMessage('assistant', '之前收到的脚本内容现在可以处理了。');
        const pendingScript = workflow.pendingScriptContent;
        updateWorkflow({ pendingScriptContent: undefined });
        await handleScriptGeneration(pendingScript);
      } else if (workflow.productRefImage) {
        // 已经有产品参考图了，直接进入脚本阶段
        addMessage('assistant', '产品和模特参考图都齐了，可以开始脚本了。');
        setOptions([
          { label: '让 AI 写脚本', action: 'generate_script' },
          { label: '上传脚本', action: 'upload_script' }
        ]);
      } else {
        // 追问是否需要产品图
        addMessage('assistant', '需要上传产品图吗？还是直接进入脚本阶段？');
        setOptions([
          { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
          { label: '直接写脚本', action: 'skip_to_script' }
        ]);
      }
    } catch (e: any) {
      if (!handleApiError(e)) {
        addMessage('assistant', '处理模特图时出错了。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModelUpload = async (files: File[]) => {
    if (!checkApiKeyAndPrompt()) return;

    setLoading(true);
    const base64Images = await Promise.all(files.map(fileToBase64));

    addMessage('user', '上传了模特图片', base64Images);
    await processModelImages(base64Images);
  };

  // --- 重新生成参考图 ---
  // v3.12: 支持自定义描述参数
  const handleRegenerateProductRef = async (customDescription?: string) => {
    if (!checkApiKeyAndPrompt()) return;

    // 检查是否有原始产品图片
    if (!workflow.productImages || workflow.productImages.length === 0) {
      addMessage('assistant', '没有找到原始产品图片，请重新上传产品图。');
      setOptions([{ label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' }]);
      return;
    }

    // 检查是否有产品特征（用于生成提示词）
    if (!workflow.productFeatures) {
      addMessage('assistant', '产品特征数据丢失，需要重新上传产品图进行分析。');
      setOptions([{ label: '重新上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' }]);
      return;
    }

    setLoading(true);
    addMessage('assistant', '正在重新生成产品参考图...');

    try {
      const features = workflow.productFeatures;
      // v3.12: 如果有自定义描述，使用自定义描述；否则使用原始特征
      const productDetailsSection = customDescription
        ? `【产品特征描述】\n${customDescription}`
        : `【从参考图中观察到的产品特征】
- 形状轮廓：${features.shape}
- 配色方案：${features.colors.join('、')}
- 材质质感：${features.material}
- 设计风格：${features.style}
- 细节特征：${features.details?.join('、') || '保持参考图中的所有细节'}`;

      // v3.10: Product Reference Sheet 布局（与模特参考图保持一致）
      const prompt = `
【重要】请仔细查看我上传的产品参考图片，然后生成这个【完全相同的产品】的专业 Product Reference Sheet。

⚠️ 核心要求：生成的必须是【图片中这个具体产品】的不同角度，不是类似产品，不是同品类产品，是【这一个产品】。

${productDetailsSection}

【整体布局】宽长方形，宽高比约 2.5:1，填满整个画布，不要留黑边
- 左侧 1/4：主形象（完整产品图，最佳展示角度）
- 右侧 3/4：Design Sheet（4 个视图横排）

【左侧主形象要求】
- 完整产品图，选择最能代表产品的角度
- 对于有正面概念的产品（如包装盒、饮料瓶）：展示 logo/品牌面
- 对于无明确正面的产品（如耳机、配件）：展示 45 度经典角度

【右侧 Design Sheet 要求】
- 4 个视图横排：正面 → 侧面 → 背面 → 45度斜侧/细节特写
- 最后一个位置根据产品特性判断：
  • 有明显多面特征的产品：45度斜侧
  • 有细节亮点的产品（logo、纹理、功能部件）：细节特写

【严格要求】
1. 填满整个画布，左右上下不要留黑边或空白
2. 产品形状必须与参考图完全一致
3. 产品图案/纹理必须与参考图完全一致
4. 产品颜色必须与参考图完全一致
5. 产品比例必须与参考图完全一致
6. 纯白色或浅灰色背景
7. 统一的柔和产品摄影光效
8. 不需要任何文字标注、引线或说明
      `.trim();

      const gridImage = await gemini.generateReferenceGrid(prompt, 'product', workflow.productImages);
      updateWorkflow({ productRefImage: gridImage });

      addMessage('assistant', '产品参考图已重新生成！');

      // 根据当前状态设置选项
      if (workflow.modelRefImage) {
        setOptions([
          { label: '让 AI 写脚本', action: 'generate_script' },
          { label: '上传脚本', action: 'upload_script' }
        ]);
      } else {
        setOptions([
          { label: '添加模特', action: 'add_model' },
          { label: '从模特库选择', action: 'select_from_library' },
          { label: '直接写脚本', action: 'skip_to_script' }
        ]);
      }
    } catch (e: any) {
      if (!handleApiError(e)) {
        addMessage('assistant', '重新生成产品参考图失败，请重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  // v3.12: 支持自定义描述参数
  const handleRegenerateModelRef = async (customDescription?: string) => {
    if (!checkApiKeyAndPrompt()) return;

    // 检查是否有原始模特图片
    if (!workflow.modelImages || workflow.modelImages.length === 0) {
      addMessage('assistant', '没有找到原始模特图片，请重新上传模特图。');
      setOptions([{ label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' }]);
      return;
    }

    // 检查是否有模特特征
    if (!workflow.modelFeatures) {
      addMessage('assistant', '模特特征数据丢失，需要重新上传模特图进行分析。');
      setOptions([{ label: '重新上传模特图', action: 'UPLOAD_MODEL_TRIGGER' }]);
      return;
    }

    setLoading(true);
    addMessage('assistant', '正在重新生成模特参考图...');

    try {
      const features = workflow.modelFeatures;
      // v3.12: 如果有自定义描述，使用自定义描述；否则使用原始特征
      const modelDetailsSection = customDescription
        ? `【模特特征描述】\n${customDescription}`
        : `【从参考图中观察到的模特特征】
- 脸型：${features.face?.shape || '标准'}
- 五官特征：${features.face?.features || '精致'}
- 肤色：${features.face?.skinTone || '自然'}
- 发型：${features.hair?.style || '自然'}
- 发色：${features.hair?.color || '黑色'}
- 发长：${features.hair?.length || '中长'}
- 体型：${features.body?.type || '匀称'}
- 气质：${features.vibe}`;

      // v3.8.1: Character Reference Sheet 布局（移除标注、明确半身照、填满画布）
      const prompt = `
【重要】请仔细查看我上传的模特参考图片，然后生成【这位模特】的专业 Character Reference Sheet。

⚠️ 核心要求：生成的必须是【图片中这位模特本人】，不是相似的人，是【这一位模特】。

${modelDetailsSection}

【整体布局】宽长方形，宽高比约 2.5:1，填满整个画布，不要留黑边
- 左侧 1/4：主形象（正面半身照，从胸部到头顶完整呈现，不是脸部特写大头照）
- 右侧 3/4：Design Sheet（4 个全身视角横排）

【左侧主形象要求】
- 必须是「半身照」：从胸部到头顶，能看到肩膀和上半身轮廓
- 不是「大头照」：不要只拍脸部特写
- 用于快速识别模特的整体形象

【右侧 Design Sheet 内容】
视角横排（从左到右）：
1. 正面全身
2. 右侧全身
3. 背面全身
4. 45度斜侧全身

【严格要求】
1. 填满整个画布，左右上下不要留黑边或空白
2. 模特面部特征必须与参考图完全一致（五官轮廓、眼睛形状、鼻子、嘴唇）
3. 模特发型和发色必须与参考图完全一致
4. 模特肤色和身材比例必须与参考图完全一致
5. 模特气质必须与参考图完全一致（${features.vibe}）
6. 服装统一为简洁的中性色（白T恤+牛仔裤或类似）
7. 纯白色或浅灰色背景
8. 统一的柔和人像摄影光效
9. 表情自然放松
10. 真人照片风格，专业角色设计表排版
11. 不需要任何文字标注、引线或说明
      `.trim();

      const gridImage = await gemini.generateReferenceGrid(prompt, 'model', workflow.modelImages);
      updateWorkflow({ modelRefImage: gridImage });

      addMessage('assistant', '模特参考图已重新生成！');

      // 根据当前状态设置选项
      if (workflow.productRefImage) {
        setOptions([
          { label: '让 AI 写脚本', action: 'generate_script' },
          { label: '上传脚本', action: 'upload_script' }
        ]);
      } else {
        setOptions([
          { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
          { label: '直接写脚本', action: 'skip_to_script' }
        ]);
      }
    } catch (e: any) {
      if (!handleApiError(e)) {
        addMessage('assistant', '重新生成模特参考图失败，请重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- v3.2 脚本创作引导问答 ---
  const SCRIPT_GUIDE_QUESTIONS = [
    {
      step: 1,
      question: '先聊聊**视觉风格**——你想要什么样的影像质感？',
      options: [
        { label: '电影感大片', action: 'style_cinematic', desc: '追求大银幕质感，注重光影氛围' },
        { label: 'MV潮流感', action: 'style_mv', desc: '节奏明快，色彩大胆' },
        { label: '纪录片真实感', action: 'style_documentary', desc: '真实、接地气，强调情感共鸣' },
        { label: '实验艺术感', action: 'style_experimental', desc: '创意先行，打破常规' },
      ]
    },
    {
      step: 2,
      question: '**开场设计**——你想用什么方式在前3秒抓住观众？',
      options: [
        { label: '强视觉冲击', action: 'opening_impact', desc: '第一帧就抓眼球' },
        { label: '制造悬念', action: 'opening_suspense', desc: '引发好奇心' },
        { label: '情绪共鸣', action: 'opening_emotion', desc: '以情动人' },
        { label: '反差对比', action: 'opening_contrast', desc: '用对比制造张力' },
      ]
    },
    {
      step: 3,
      question: '**情绪曲线**——整支片子的节奏你想怎么走？',
      options: [
        { label: '渐入高潮', action: 'curve_buildup', desc: '铺垫→发展→高潮→收尾' },
        { label: '高开高走', action: 'curve_intense', desc: '全程高能，快节奏' },
        { label: '平稳叙事', action: 'curve_steady', desc: '娓娓道来，情绪舒缓' },
        { label: '反转收尾', action: 'curve_twist', desc: '前段铺垫，结尾反转' },
      ]
    },
    {
      step: 4,
      question: '有没有你脑海中的**标志性画面**？\n那种希望观众过目不忘的"名场面"？\n\n（如果有，请在输入框描述；没有的话点击"跳过"）',
      options: [
        { label: '跳过这个问题', action: 'skip_signature', desc: '让 AI 自由发挥' },
      ],
      freeInput: true,
    },
    {
      step: 5,
      question: '**广告时长**是多少？',
      options: [
        { label: '15秒', action: 'duration_15s', desc: '极致精简，3-5个镜头' },
        { label: '30秒', action: 'duration_30s', desc: '标准TVC，6-10个镜头' },
        { label: '60秒', action: 'duration_60s', desc: '品牌故事片，10-15个镜头' },
      ]
    },
    {
      step: 6,
      question: '有没有**参考风格**？\n比如某个品牌的广告风格、某个导演的作品、或者某种氛围？\n\n（如果有，请在输入框描述；没有的话点击"跳过"）',
      options: [
        { label: '跳过，让 AI 自由发挥', action: 'skip_reference', desc: '' },
      ],
      freeInput: true,
    },
  ];

  // 开始引导问答流程
  const startScriptGuide = () => {
    setScriptGuideStep(1);
    setScriptGuideAnswers({});
    const q = SCRIPT_GUIDE_QUESTIONS[0];
    addMessage('assistant', q.question);
    setOptions(q.options.map(opt => ({
      label: opt.label,
      action: opt.action,
      params: { desc: opt.desc }
    })));
  };

  // 处理引导问答选择
  const handleScriptGuideAnswer = (action: string, freeInputValue?: string) => {
    const currentStep = scriptGuideStep;
    const newAnswers = { ...scriptGuideAnswers };

    // 根据 action 更新答案
    if (action.startsWith('style_')) {
      newAnswers.visualStyle = action.replace('style_', '') as any;
    } else if (action.startsWith('opening_')) {
      newAnswers.openingDesign = action.replace('opening_', '') as any;
    } else if (action.startsWith('curve_')) {
      newAnswers.emotionCurve = action.replace('curve_', '') as any;
    } else if (action.startsWith('duration_')) {
      newAnswers.duration = action.replace('duration_', '') as any;
    } else if (action === 'skip_signature') {
      // 跳过标志性画面
    } else if (action === 'skip_reference') {
      // 跳过参考风格
    }

    // 处理自由输入
    if (freeInputValue && freeInputValue.trim()) {
      if (currentStep === 4) {
        newAnswers.signatureScene = freeInputValue.trim();
      } else if (currentStep === 6) {
        newAnswers.referenceStyle = freeInputValue.trim();
      }
    }

    setScriptGuideAnswers(newAnswers);

    // 进入下一步
    const nextStep = currentStep + 1;

    if (nextStep <= 6) {
      // 还有问题
      setScriptGuideStep(nextStep);
      const q = SCRIPT_GUIDE_QUESTIONS[nextStep - 1];
      addMessage('assistant', q.question);
      setOptions(q.options.map(opt => ({
        label: opt.label,
        action: opt.action,
        params: { desc: opt.desc }
      })));
    } else {
      // 问答完成，进入确认步骤
      setScriptGuideStep(7);
      showScriptGuideConfirmation(newAnswers);
    }
  };

  // 显示引导问答确认
  const showScriptGuideConfirmation = (answers: ScriptGuideAnswers) => {
    const styleMap: Record<string, string> = {
      cinematic: '电影感大片',
      mv: 'MV潮流感',
      documentary: '纪录片真实感',
      experimental: '实验艺术感'
    };
    const openingMap: Record<string, string> = {
      impact: '强视觉冲击',
      suspense: '制造悬念',
      emotion: '情绪共鸣',
      contrast: '反差对比'
    };
    const curveMap: Record<string, string> = {
      buildup: '渐入高潮',
      intense: '高开高走',
      steady: '平稳叙事',
      twist: '反转收尾'
    };

    let summary = `好的，我理解你想要的是：\n\n`;
    summary += `📽️ **视觉风格**：${answers.visualStyle ? styleMap[answers.visualStyle] : '未指定'}\n`;
    summary += `🎬 **开场设计**：${answers.openingDesign ? openingMap[answers.openingDesign] : '未指定'}\n`;
    summary += `📈 **情绪曲线**：${answers.emotionCurve ? curveMap[answers.emotionCurve] : '未指定'}\n`;
    summary += `⏱️ **广告时长**：${answers.duration || '30s'}\n`;
    if (answers.signatureScene) {
      summary += `✨ **标志性画面**：${answers.signatureScene}\n`;
    }
    if (answers.referenceStyle) {
      summary += `🎯 **参考风格**：${answers.referenceStyle}\n`;
    }
    summary += `\n确认这些设定，我就开始写脚本了。`;

    addMessage('assistant', summary);
    setOptions([
      { label: '确认，开始生成', action: 'confirm_generate' },
      { label: '补充更多信息', action: 'add_more' },
    ]);
  };

  // 基于引导问答生成脚本
  const handleScriptGenerationWithGuide = async () => {
    if (!checkApiKeyAndPrompt()) return;

    setLoading(true);
    setScriptGuideStep(0); // 重置引导状态

    try {
      addMessage('assistant', '正在基于你的艺术方向构思脚本...');
      const productInfo = workflow.productFeatures ? JSON.stringify(workflow.productFeatures) : "Unknown Product";

      const script = await gemini.generateScriptWithGuide(scriptGuideAnswers, productInfo, workflow.hasModel);
      updateWorkflow({ script, step: 'script' });

      // v3.3: AI 生成的脚本直接是最优版本，不需要自我分析
      // 直接展示脚本，让用户确认或调整
      addMessage('assistant', `脚本写好了，共 ${script.shots.length} 个镜头。看看有没有要调整的地方？`);

      setOptions([
        { label: '满意，生成分镜', action: 'generate_storyboard' },
        { label: '我想调整', action: 'edit_script' },
      ]);

    } catch (e: any) {
      if (!handleApiError(e)) {
        addMessage('assistant', '生成脚本失败，请重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- v3.2 脚本分析 ---
  const handleScriptAnalysis = async (script: Script) => {
    setIsAnalyzingScript(true);
    try {
      const analysis = await gemini.analyzeScript(script);
      setScriptAnalysis(analysis);

      // 显示分析报告 - 使用流式输出
      const renderStars = (score: number) => '★'.repeat(score) + '☆'.repeat(5 - score);

      let report = `📊 **脚本影视感评估报告**\n\n`;
      report += `**基础信息**\n`;
      report += `- 镜头数量：${analysis.basicInfo.shotCount} 个\n`;
      report += `- 预估时长：${analysis.basicInfo.estimatedDuration}\n`;
      report += `- 风格判断：${analysis.basicInfo.styleJudgment}\n\n`;

      report += `**影视感评分**\n`;
      report += `- 开场冲击力：${renderStars(analysis.scores.openingImpact)}\n`;
      report += `- 镜头语言丰富度：${renderStars(analysis.scores.shotLanguage)}\n`;
      report += `- 节奏张力：${renderStars(analysis.scores.rhythmTension)}\n`;
      report += `- 视觉记忆点：${renderStars(analysis.scores.visualMemory)}\n\n`;

      if (analysis.highlights.length > 0) {
        report += `**亮点**\n`;
        analysis.highlights.forEach(h => {
          report += `✅ ${h}\n`;
        });
        report += '\n';
      }

      if (analysis.suggestions.length > 0) {
        report += `**提升建议**\n`;
        analysis.suggestions.forEach(s => {
          report += `💡 ${s}\n`;
        });
      }

      // v3.2: 使用流式输出效果
      const streamMsgId = addMessage('assistant', '', undefined, true);
      let current = '';
      for (const char of report) {
        current += char;
        updateMessageById(streamMsgId, { content: current });
        // 每个字符间隔 8-12ms，分析报告稍快一些
        await new Promise(r => setTimeout(r, 8 + Math.random() * 4));
      }
      updateMessageById(streamMsgId, { content: current, isStreaming: false });

      // 显示三个选项
      setOptions([
        { label: '按建议优化脚本', action: 'optimize_script' },
        { label: '我自己改', action: 'edit_script_myself' },
        { label: '不用改，直接生成分镜', action: 'skip_to_storyboard' },
      ]);

    } catch (e: any) {
      console.error('Script analysis error:', e);
      addMessage('assistant', '脚本分析遇到问题，但不影响后续流程。');
      setOptions([
        { label: '修改脚本', action: 'edit_script' },
        { label: '直接生成分镜', action: 'generate_storyboard' },
      ]);
    } finally {
      setIsAnalyzingScript(false);
    }
  };

  // 优化脚本
  const handleOptimizeScript = async () => {
    if (!workflow.script || !scriptAnalysis) return;
    if (!checkApiKeyAndPrompt()) return;

    setLoading(true);
    try {
      addMessage('assistant', '正在按建议优化脚本...');
      const optimizedScript = await gemini.optimizeScript(workflow.script, scriptAnalysis);
      updateWorkflow({ script: optimizedScript });

      addMessage('assistant', `脚本已优化！共 ${optimizedScript.shots.length} 个镜头。\n\n重新评估中...`);

      // 重新分析优化后的脚本
      await handleScriptAnalysis(optimizedScript);

    } catch (e: any) {
      if (!handleApiError(e)) {
        addMessage('assistant', '优化脚本失败，请重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  // 原有的简单脚本生成（兼容旧流程）
  const handleScriptGeneration = async (userDesc: string) => {
    if (!checkApiKeyAndPrompt()) return;

    setLoading(true);
    if (!userDesc) {
      addMessage('assistant', '请告诉我你的广告构思，例如：核心卖点、目标受众、情绪基调。');
      setLoading(false);
      return;
    }

    try {
      addMessage('assistant', '正在构思脚本...');
      const productInfo = workflow.productFeatures ? JSON.stringify(workflow.productFeatures) : "Unknown Product";

      const script = await gemini.generateScript(userDesc, productInfo, workflow.hasModel);
      updateWorkflow({ script, step: 'script' });

      addMessage('assistant', `脚本已就绪！共 ${script.shots.length} 个镜头。\n\n正在进行影视感评估...`);

      // v3.2: 生成完脚本后自动进行分析
      await handleScriptAnalysis(script);

    } catch (e: any) {
      if (!handleApiError(e)) {
        addMessage('assistant', '生成脚本失败，请重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStoryboardGeneration = async (startFromIndex: number = 0) => {
    if (!workflow.script) return;
    if (!checkApiKeyAndPrompt()) return;

    // v3.11: 重置中断标志，开始生成
    storyboardAbortRef.current = false;
    setIsStoryboardGenerating(true);
    setLoading(true);
    updateWorkflow({ step: 'storyboard' });

    if (startFromIndex === 0) {
      addMessage('assistant', '开始生成分镜图，请稍候...');
    } else {
      addMessage('assistant', `继续生成分镜图，从第 ${startFromIndex + 1} 帧开始...`);
    }

    const shots = [...workflow.script.shots];
    const newShots = [...shots];

    // 只标记从 startFromIndex 开始的未完成帧
    for (let i = startFromIndex; i < newShots.length; i++) {
      if (!newShots[i].imageUrl) {
        newShots[i].isGenerating = true;
      }
    }
    updateWorkflow({ script: { ...workflow.script, shots: newShots } });

    for (let i = startFromIndex; i < shots.length; i++) {
      // v3.11: 检查是否被中断
      if (storyboardAbortRef.current) {
        // 取消当前帧的 isGenerating 状态
        newShots[i] = { ...newShots[i], isGenerating: false };
        updateWorkflow({ script: { ...workflow.script, shots: [...newShots] } });
        addMessage('assistant', `分镜图生成已停止。已完成 ${i} 帧，剩余 ${shots.length - i} 帧待生成。`);
        setIsStoryboardGenerating(false);
        setLoading(false);
        return;
      }

      const shot = shots[i];

      // 跳过已生成的帧
      if (shot.imageUrl) {
        newShots[i] = { ...shot, isGenerating: false };
        continue;
      }

      const prompt = await gemini.generateShotPrompt(
        shot.description,
        shot.shotType,
        shot.cameraMove,
        workflow.productFeatures!,
        workflow.modelFeatures
      );

      // v3.11: 生成图片前再次检查中断
      if (storyboardAbortRef.current) {
        newShots[i] = { ...newShots[i], isGenerating: false };
        updateWorkflow({ script: { ...workflow.script, shots: [...newShots] } });
        addMessage('assistant', `分镜图生成已停止。已完成 ${i} 帧，剩余 ${shots.length - i} 帧待生成。`);
        setIsStoryboardGenerating(false);
        setLoading(false);
        return;
      }

      // 传入参考图以保持视觉一致性
      const imageUrl = await gemini.generateStoryboardFrame(
        prompt,
        workflow.productRefImage,
        workflow.modelRefImage
      );

      // v3.11: API 返回后再次检查是否被中断（用户可能在 API 调用期间点了停止）
      if (storyboardAbortRef.current) {
        // 已被中断，不更新这一帧，直接退出
        return;
      }

      newShots[i] = {
        ...shot,
        prompt,
        imageUrl,
        isGenerating: false
      };

      updateWorkflow({ script: { ...workflow.script, shots: [...newShots] } });
    }

    addMessage('assistant', `分镜图全部生成完成！共 ${shots.length} 帧。`);
    setIsStoryboardGenerating(false);
    setLoading(false);

    const newOptions = await gemini.generateDynamicOptions('Storyboard finished.', getWorkflowStateInfo());
    setOptions(newOptions);
  };

  // v3.11: 停止分镜图生成
  const handleStopStoryboard = () => {
    storyboardAbortRef.current = true;
    setIsStoryboardGenerating(false);
    setLoading(false);

    // 清除所有未完成帧的 isGenerating 状态
    if (workflow.script) {
      const newShots = workflow.script.shots.map(shot => ({
        ...shot,
        isGenerating: false
      }));
      updateWorkflow({ script: { ...workflow.script, shots: newShots } });
    }
  };

  // v3.11: 继续分镜图生成（从第一张未完成的开始）
  const handleContinueStoryboard = () => {
    if (!workflow.script) return;

    // 找到第一张没有 imageUrl 的帧
    const firstIncompleteIndex = workflow.script.shots.findIndex(shot => !shot.imageUrl);
    if (firstIncompleteIndex === -1) {
      // 所有帧都已完成
      addMessage('assistant', '所有分镜图都已生成完成！');
      return;
    }

    handleStoryboardGeneration(firstIncompleteIndex);
  };

  // 只重新生成指定的帧（素材变更影响检测用）
  const handleRegenerateSelectedFrames = async (frameNumbers: number[]) => {
    if (!workflow.script) return;
    if (!checkApiKeyAndPrompt()) return;

    setLoading(true);
    const shots = [...workflow.script.shots];
    const newShots = [...shots];

    // 标记要重新生成的帧
    frameNumbers.forEach(num => {
      const idx = newShots.findIndex(s => s.shotNumber === num);
      if (idx !== -1) {
        newShots[idx].isGenerating = true;
      }
    });
    updateWorkflow({ script: { ...workflow.script, shots: newShots } });

    for (const num of frameNumbers) {
      const idx = newShots.findIndex(s => s.shotNumber === num);
      if (idx === -1) continue;

      const shot = newShots[idx];
      const prompt = await gemini.generateShotPrompt(
        shot.description,
        shot.shotType,
        shot.cameraMove,
        workflow.productFeatures!,
        workflow.modelFeatures
      );

      const imageUrl = await gemini.generateStoryboardFrame(
        prompt,
        workflow.productRefImage,
        workflow.modelRefImage
      );

      newShots[idx] = {
        ...shot,
        prompt,
        imageUrl,
        isGenerating: false
      };

      updateWorkflow({ script: { ...workflow.script, shots: [...newShots] } });
    }

    addMessage('assistant', `已重新生成第 ${frameNumbers.join('、')} 帧！`);
    setLoading(false);
    setOptions([
      { label: '修改脚本', action: 'edit_script' },
      { label: '导出分镜', action: 'export' }
    ]);
  };

  // --- 下载辅助函数 ---
  // 将 base64 图片转为 Blob
  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  };

  // 生成脚本 Markdown 内容
  const generateScriptMarkdown = (): string => {
    if (!workflow.script) return '';

    const lines: string[] = [];
    lines.push(`# ${getCurrentProjectName()} - 广告脚本\n`);
    lines.push(`## 产品信息\n`);
    lines.push(`${workflow.script.productInfo || '未设置'}\n`);

    if (workflow.productFeatures) {
      lines.push(`### 产品特征`);
      lines.push(`- 形状：${workflow.productFeatures.shape}`);
      lines.push(`- 配色：${workflow.productFeatures.colors.join('、')}`);
      lines.push(`- 材质：${workflow.productFeatures.material}`);
      lines.push(`- 风格：${workflow.productFeatures.style}\n`);
    }

    if (workflow.modelFeatures) {
      lines.push(`## 模特信息`);
      lines.push(`- 气质：${workflow.modelFeatures.vibe}`);
      lines.push(`- 年龄段：${workflow.modelFeatures.ageRange || '未设置'}`);
      if (workflow.modelFeatures.face) {
        lines.push(`- 脸型：${workflow.modelFeatures.face.shape || '标准'}`);
        lines.push(`- 肤色：${workflow.modelFeatures.face.skinTone || '自然'}`);
      }
      if (workflow.modelFeatures.hair) {
        lines.push(`- 发型：${workflow.modelFeatures.hair.style || '自然'}`);
      }
      lines.push('');
    }

    lines.push(`## 分镜脚本\n`);
    lines.push(`| 镜头 | 时长 | 景别 | 运镜 | 画面描述 | 台词/旁白 |`);
    lines.push(`|------|------|------|------|----------|----------|`);

    workflow.script.shots.forEach(shot => {
      const dialogue = shot.dialogue || '-';
      lines.push(`| Shot ${shot.shotNumber} | ${shot.duration} | ${shot.shotType} | ${shot.cameraMove} | ${shot.description} | ${dialogue} |`);
    });

    lines.push(`\n---\n`);
    lines.push(`生成时间：${new Date().toLocaleString('zh-CN')}`);

    return lines.join('\n');
  };

  // 单独下载产品参考图
  const handleDownloadProductRef = () => {
    if (!workflow.productRefImage) {
      addMessage('assistant', '还没有产品参考图可以下载。');
      return;
    }
    const blob = base64ToBlob(workflow.productRefImage);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_reference.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 单独下载模特参考图
  const handleDownloadModelRef = () => {
    if (!workflow.modelRefImage) {
      addMessage('assistant', '还没有模特参考图可以下载。');
      return;
    }
    const blob = base64ToBlob(workflow.modelRefImage);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'model_reference.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 单独下载脚本 Markdown
  const handleDownloadScript = () => {
    if (!workflow.script) {
      addMessage('assistant', '还没有脚本可以下载。');
      return;
    }
    const markdown = generateScriptMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'script.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 单独下载某一帧分镜图
  const handleDownloadFrame = (shotNumber: number) => {
    const shot = workflow.script?.shots.find(s => s.shotNumber === shotNumber);
    if (!shot?.imageUrl) {
      addMessage('assistant', `第 ${shotNumber} 帧还没有生成。`);
      return;
    }
    const blob = base64ToBlob(shot.imageUrl);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shot_${shotNumber.toString().padStart(2, '0')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 打包下载全部素材
  const handlePackageDownload = async () => {
    addMessage('assistant', '正在打包所有素材...');
    setLoading(true);

    try {
      const zip = new JSZip();
      const projectName = getCurrentProjectName().replace(/[/\\?%*:|"<>]/g, '_'); // 清理文件名非法字符

      // 添加产品参考图
      if (workflow.productRefImage) {
        const productBlob = base64ToBlob(workflow.productRefImage);
        zip.file('product_reference.png', productBlob);
      }

      // 添加模特参考图
      if (workflow.modelRefImage) {
        const modelBlob = base64ToBlob(workflow.modelRefImage);
        zip.file('model_reference.png', modelBlob);
      }

      // 添加脚本 Markdown
      if (workflow.script) {
        const scriptMd = generateScriptMarkdown();
        zip.file('script.md', scriptMd);
      }

      // 添加分镜图到 storyboard 文件夹
      if (workflow.script?.shots) {
        const storyboardFolder = zip.folder('storyboard');
        for (const shot of workflow.script.shots) {
          if (shot.imageUrl) {
            const frameBlob = base64ToBlob(shot.imageUrl);
            storyboardFolder?.file(`shot_${shot.shotNumber.toString().padStart(2, '0')}.png`, frameBlob);
          }
        }
      }

      // 生成 zip 文件
      const content = await zip.generateAsync({ type: 'blob' });

      // 下载
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 统计打包内容
      let itemCount = 0;
      if (workflow.productRefImage) itemCount++;
      if (workflow.modelRefImage) itemCount++;
      if (workflow.script) itemCount++;
      const frameCount = workflow.script?.shots.filter(s => s.imageUrl).length || 0;
      itemCount += frameCount;

      addMessage('assistant', `打包完成！已下载 ${projectName}.zip，包含 ${itemCount} 个文件（${frameCount} 张分镜图）。`);
      setOptions([
        { label: '修改脚本', action: 'edit_script' },
        { label: '全部重新生成', action: 'regenerate_all' }
      ]);
    } catch (error) {
      console.error('Package download error:', error);
      addMessage('assistant', '打包时出错了，请重试。');
    } finally {
      setLoading(false);
    }
  };

  // 导出分镜图（旧的单独下载方式，保留兼容）
  const handleExportStoryboard = async () => {
    // 直接调用打包下载
    await handlePackageDownload();
  };

  // --- Main Interaction Loop ---
  const handleUserAction = async (inputText: string = '', attachments: File[] = []) => {
    if (!inputText && attachments.length === 0) return;

    if (inputText) addMessage('user', inputText);

    setLoading(true);

    try {
      let intentStr = 'GENERAL_QUESTION';
      let params = {};
      let base64Images: string[] = [];

      // 转换附件为 base64
      if (attachments.length > 0) {
        base64Images = await Promise.all(attachments.map(fileToBase64));
      }

      if (attachments.length > 0) {
        // 有图片时，根据当前工作流阶段判断意图（并行入口模式）
        // v3.9: 首先检查是否有 pendingReupload 标记（用户明确表达要替换素材）
        if (workflow.pendingReupload === 'product') {
          intentStr = 'UPLOAD_PRODUCT';
          // 清除标记
          updateWorkflow({ pendingReupload: undefined });
        } else if (workflow.pendingReupload === 'model') {
          intentStr = 'UPLOAD_MODEL';
          // 清除标记
          updateWorkflow({ pendingReupload: undefined });
        } else if (workflow.step === 'start') {
          // 初始阶段，根据用户的入口选择判断
          if (workflow.entryPath === 'model_upload') {
            // 用户选择了「上传模特图」入口
            intentStr = 'UPLOAD_MODEL';
          } else {
            // 默认当作产品图处理
            intentStr = 'UPLOAD_PRODUCT';
          }
        } else if (workflow.step === 'product_ref' && !hasModelRef()) {
          // 有产品图，没有模特图，当作模特图处理
          intentStr = 'UPLOAD_MODEL';
        } else if (workflow.step === 'model_ref' && !hasProductRef()) {
          // 有模特图，没有产品图，当作产品图处理
          intentStr = 'UPLOAD_PRODUCT';
        } else {
          intentStr = 'GENERAL_QUESTION';
        }
      } else {
        const intentRes = await gemini.detectIntent(inputText, workflow.step);
        intentStr = intentRes.intent;
        params = intentRes.params;
      }

      console.log('Detected Intent:', intentStr);

      // 跳步骤拦截检查
      if (handleSkipStepIntercept(intentStr, base64Images, inputText)) {
        setLoading(false);
        setInput('');
        return;
      }

      switch (intentStr) {
        case 'UPLOAD_PRODUCT':
          if (attachments.length > 0) await handleProductUpload(attachments);
          else document.getElementById('file-upload-trigger')?.click();
          break;

        case 'UPLOAD_MODEL':
          // 并行入口：允许直接上传模特图
          if (attachments.length > 0) await handleModelUpload(attachments);
          else document.getElementById('file-upload-trigger')?.click();
          break;

        case 'REUPLOAD_PRODUCT':
          // v3.9: 用户表达要换产品图，设置标记并弹出上传框
          addMessage('assistant', '好的，请上传新的产品图。');
          updateWorkflow({ pendingReupload: 'product' });
          document.getElementById('file-upload-trigger')?.click();
          break;

        case 'REUPLOAD_MODEL':
          // v3.9: 用户表达要换模特，设置标记并弹出上传框
          addMessage('assistant', '好的，请上传新的模特照片。');
          updateWorkflow({ pendingReupload: 'model' });
          document.getElementById('file-upload-trigger')?.click();
          break;

        case 'SKIP_MODEL':
        case 'skip_to_script':
          // 检查是否有任何参考图
          if (!hasAnyRef()) {
            addMessage('assistant', '写脚本需要至少一个参考图。先上传产品图或选择模特吧。');
            setOptions([
              { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
              { label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' },
              { label: '从模特库选择', action: 'select_from_library' }
            ]);
            break;
          }
          addMessage('assistant', '好的，直接进入脚本阶段。');
          updateWorkflow({ step: 'script' });
          // 检查是否有暂存的脚本
          if (workflow.pendingScriptContent) {
            addMessage('assistant', '之前你提到的脚本我记着呢，现在来处理。');
            await handleScriptGeneration(workflow.pendingScriptContent);
            updateWorkflow({ pendingScriptContent: undefined });
          } else {
            addMessage('assistant', '请提供广告脚本，或者告诉我你的创意，我来帮你写。');
            setOptions([
              { label: "让 AI 写脚本", action: "generate_script" },
              { label: "上传脚本", action: "upload_script" }
            ]);
          }
          break;

        case 'GENERATE_SCRIPT':
          // 检查是否有任何参考图
          if (!hasAnyRef()) {
            addMessage('assistant', '脚本的事先记着。不过分镜需要参考图才能保持视觉一致——上传产品图或选择模特，然后马上处理脚本。');
            setOptions([
              { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
              { label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' },
              { label: '从模特库选择', action: 'select_from_library' }
            ]);
            break;
          }
          await handleScriptGeneration(inputText || (params as any).description);
          break;

        case 'UPLOAD_SCRIPT':
          if (!hasAnyRef()) {
            updateWorkflow({ pendingScriptContent: inputText });
            addMessage('assistant', '脚本收到了，先存着。不过分镜需要参考图才能保持视觉一致——上传产品图或选择模特，然后马上处理脚本。');
            setOptions([
              { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
              { label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' },
              { label: '从模特库选择', action: 'select_from_library' }
            ]);
            break;
          }
          const parsedScript = await gemini.parseScript(inputText);
          updateWorkflow({ script: parsedScript, step: 'script' });
          addMessage('assistant', `脚本解析完成！共 ${parsedScript.shots.length} 个镜头。\n\n正在进行影视感评估...`);
          // v3.2: 上传脚本后也自动进行分析
          await handleScriptAnalysis(parsedScript);
          break;

        case 'REGENERATE_FRAME':
        case 'EDIT_FRAME_PROMPT':
          addMessage('assistant', '你可以直接在右侧画布上点击对应的分镜帧进行修改。');
          break;

        case 'start_storyboard':
        case 'GENERATE_STORYBOARD':
          // 检查前置条件
          const check = canProceedTo('storyboard');
          if (!check.allowed) {
            addMessage('assistant', check.message!);
            if (!hasAnyRef()) {
              setOptions([
                { label: '上传产品图', action: 'UPLOAD_PRODUCT_TRIGGER' },
                { label: '上传模特图', action: 'UPLOAD_MODEL_TRIGGER' },
                { label: '从模特库选择', action: 'select_from_library' }
              ]);
            } else {
              setOptions([
                { label: "让 AI 写脚本", action: "generate_script" },
                { label: "上传脚本", action: "upload_script" }
              ]);
            }
            break;
          }
          await handleStoryboardGeneration();
          break;

        case 'MODIFY_SCRIPT':
          // 执行脚本修改
          if (!workflow.script) {
            addMessage('assistant', '还没有脚本，先上传或生成一个吧。');
            setOptions([
              { label: '让 AI 写脚本', action: 'generate_script' },
              { label: '上传脚本', action: 'upload_script' }
            ]);
            break;
          }
          // 获取最近的对话上下文（最近10条消息）
          const recentMessages = messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
          const modifyResult = await gemini.modifyScript(workflow.script, inputText, recentMessages);
          updateWorkflow({ script: modifyResult.script });
          addMessage('assistant', `✅ ${modifyResult.summary}\n\n脚本已更新，现在共 ${modifyResult.script.shots.length} 个镜头。`);
          setOptions([
            { label: '开始生成分镜', action: 'generate_storyboard' },
            { label: '继续修改', action: 'edit_script' }
          ]);
          break;

        default:
          // 使用流式输出
          const streamMsgId = addMessage('assistant', '', undefined, true);
          let fullReply = '';

          // 逐字显示的辅助函数
          const typeText = async (text: string, baseContent: string): Promise<string> => {
            let current = baseContent;
            for (const char of text) {
              current += char;
              updateMessageById(streamMsgId, { content: current });
              // 每个字符间隔 15-25ms，模拟自然打字速度
              await new Promise(r => setTimeout(r, 15 + Math.random() * 10));
            }
            return current;
          };

          try {
            const stream = gemini.generateChatResponseStream(messages, inputText);
            for await (const chunk of stream) {
              // 逐字显示每个 chunk
              fullReply = await typeText(chunk, fullReply);
            }
            // 流式输出完成，移除 isStreaming 标记
            updateMessageById(streamMsgId, { content: fullReply, isStreaming: false });
          } catch (streamError) {
            console.error('Streaming error:', streamError);
            updateMessageById(streamMsgId, {
              content: fullReply || '抱歉，我刚刚走神了，请再说一遍？',
              isStreaming: false
            });
          }

          // 流式输出完成后再生成选项
          const opts = await gemini.generateDynamicOptions(inputText, getWorkflowStateInfo());
          setOptions(filterOptionsByStep(opts));
          break;
      }

    } catch (e) {
      console.error(e);
      addMessage('assistant', '抱歉，我刚刚走神了，请再说一遍？');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  // UI Event Handlers
  const onSend = () => handleUserAction(input);
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUserAction('', Array.from(e.target.files));
    }
  };

  const onOptionClick = async (opt: DynamicOption) => {
    if (opt.action === 'open_settings') {
      setIsApiKeyModalOpen(true);
    } else if (opt.action === 'UPLOAD_MODEL_TRIGGER') {
      // 新增：直接上传模特图的入口
      document.getElementById('file-upload-trigger')?.click();
      addMessage('assistant', '请上传模特照片。');
      // 标记下次上传的图片应被识别为模特图
      updateWorkflow({ entryPath: 'model_upload' });
    } else if (opt.action === 'select_from_library') {
      // 展开 ChatPanel 内嵌的模特库
      setIsModelsExpanded(true);
      addMessage('assistant', '请从模特库中选择一个模特：');
    } else if (opt.action === 'skip_to_script') {
      // v3.2: 跳过另一参考图，启动脚本引导问答
      startScriptGuide();
    } else if (opt.action === 'add_model' || opt.action === 'UPLOAD_MODEL_TRIGGER') {
      // 检查是否已有分镜，需要警告用户
      if (hasStoryboard()) {
        const modelFrames = detectModelFrames();
        if (modelFrames.length > 0) {
          addMessage('assistant', `现在加/换模特也行。不过已经生成的分镜里有模特出镜：\n- 检测到第 ${modelFrames.join('、')} 帧有模特\n- 这几帧需要重新生成，其他帧不受影响\n\n确定要继续吗？`);
          setOptions([
            { label: `重新生成这 ${modelFrames.length} 帧`, action: 'reupload_model' },
            { label: '全部重新生成', action: 'regenerate_all' },
            { label: '算了，不换了', action: 'cancel' }
          ]);
        } else {
          addMessage('assistant', '现在加模特也行。当前分镜没有模特镜头，加完模特后如果需要，可以修改脚本加入模特镜头。');
          setPendingMaterialChange({ type: 'model', confirmed: true });
          document.getElementById('file-upload-trigger')?.click();
        }
      } else {
        document.getElementById('file-upload-trigger')?.click();
        addMessage('assistant', '请上传模特照片。');
      }
    } else if (opt.action === 'reupload_model') {
      // 用户确认要换模特图，只重新生成受影响的帧
      setPendingMaterialChange({ type: 'model', confirmed: true });
      document.getElementById('file-upload-trigger')?.click();
    } else if (opt.action === 'skip_model') {
      handleUserAction('跳过模特');
    } else if (opt.action === 'generate_script') {
      // v3.2: 启动引导问答流程
      startScriptGuide();
    } else if (opt.action.startsWith('style_') || opt.action.startsWith('opening_') ||
               opt.action.startsWith('curve_') || opt.action.startsWith('duration_') ||
               opt.action === 'skip_signature' || opt.action === 'skip_reference') {
      // v3.2: 处理引导问答选项
      // 如果有输入框内容，作为自由输入传入
      const freeInputValue = input.trim();
      if (freeInputValue) {
        addMessage('user', freeInputValue);
        setInput('');
      }
      handleScriptGuideAnswer(opt.action, freeInputValue);
    } else if (opt.action === 'confirm_generate') {
      // v3.2: 确认引导问答，开始生成脚本
      handleScriptGenerationWithGuide();
    } else if (opt.action === 'add_more') {
      // v3.2: 补充更多信息，回到引导问答
      addMessage('assistant', '好的，那我们从头再来一遍，这次可以更详细地描述你的想法。');
      startScriptGuide();
    } else if (opt.action === 'optimize_script') {
      // v3.2: 按建议优化脚本
      handleOptimizeScript();
    } else if (opt.action === 'edit_script_myself') {
      // v3.2: 用户自己修改脚本
      addMessage('assistant', '好的，你可以在输入框里告诉我要怎么改，或者直接点击右侧脚本节点中的镜头进行编辑。');
      setOptions([
        { label: '修改镜头描述', action: 'edit_shot_description' },
        { label: '增加/删除镜头', action: 'add_delete_shot' },
        { label: '调整镜头顺序', action: 'reorder_shots' },
        { label: '改完了，生成分镜', action: 'generate_storyboard' }
      ]);
    } else if (opt.action === 'skip_to_storyboard') {
      // v3.2: 不改脚本，直接生成分镜
      handleStoryboardGeneration();
    } else if (opt.action === 'upload_script') {
      addMessage('assistant', '好的，请把你的脚本内容粘贴到输入框发送给我。\n\n脚本格式参考：\n- 每个镜头包含：画面描述、时长、景别、镜头运动\n- 可以是简单的文字描述，我会帮你解析成标准格式');
      setOptions([]); // 清空选项，等用户输入
      updateWorkflow({ step: 'script' }); // 标记进入脚本阶段，下次用户发文字会被识别为脚本
    } else if (opt.action === 'generate_storyboard') {
      handleStoryboardGeneration();
    } else if (opt.action === 'regenerate_all') {
      // 全部重新生成分镜
      if (workflow.script && workflow.script.shots.length > 0) {
        handleStoryboardGeneration();
      } else {
        addMessage('assistant', '还没有脚本，无法重新生成分镜。');
      }
    } else if (opt.action === 'UPLOAD_PRODUCT_TRIGGER') {
      // 检查是否已有分镜，需要警告用户
      if (hasStoryboard()) {
        addMessage('assistant', '可以换。不过提醒一下：\n- 产品参考图要重新生成\n- 已生成的分镜图也得全部重新来，不然产品长得不一样\n\n确定要换吗？');
        setOptions([
          { label: '确定，重新上传', action: 'reupload_product' },
          { label: '算了，不换了', action: 'cancel' }
        ]);
      } else {
        document.getElementById('file-upload-trigger')?.click();
      }
    } else if (opt.action === 'reupload_product') {
      // 用户确认要换产品图
      setPendingMaterialChange({ type: 'product', confirmed: true });
      document.getElementById('file-upload-trigger')?.click();
    } else if (opt.action === 'process_pending_script') {
      // 直接处理暂存的脚本（先添加模特的情况，但用户选择直接处理脚本）
      if (workflow.pendingScriptContent) {
        const pendingScript = workflow.pendingScriptContent;
        updateWorkflow({ pendingScriptContent: undefined });
        handleScriptGeneration(pendingScript);
      }
    } else if (opt.action === 'skip_model_process_script') {
      // 跳过模特，直接处理暂存的脚本
      updateWorkflow({ hasModel: false, step: 'script' });
      if (workflow.pendingScriptContent) {
        const pendingScript = workflow.pendingScriptContent;
        updateWorkflow({ pendingScriptContent: undefined });
        handleScriptGeneration(pendingScript);
      }
    } else if (opt.action === 'edit_shot_description' || opt.action === '修改镜头描述') {
      addMessage('assistant', '告诉我你想修改哪个镜头，怎么改。\n\n例如："把第2个镜头改成产品特写，展示瓶身细节"');
      setOptions([]);
    } else if (opt.action === 'add_delete_shot' || opt.action === '增加/删除镜头') {
      addMessage('assistant', '告诉我你想增加还是删除镜头：\n\n- 增加：说明在哪个位置加，内容是什么\n- 删除：说明删哪个镜头\n\n例如："在第3个镜头后面加一个模特使用产品的特写" 或 "删掉第4个镜头"');
      setOptions([]);
    } else if (opt.action === 'reorder_shots' || opt.action === '调整镜头顺序') {
      addMessage('assistant', '告诉我怎么调整顺序。\n\n例如："把第5个镜头移到第2个位置" 或 "把最后一个镜头放到开头"');
      setOptions([]);
    } else if (opt.action === 'edit_script') {
      // 打开脚本编辑模式
      if (workflow.script) {
        addMessage('assistant', '你想怎么修改脚本？\n\n你可以：\n1. 修改某个镜头的描述\n2. 增加或删除镜头\n3. 调整镜头顺序');
        setOptions([
          { label: '修改镜头描述', action: 'edit_shot_description' },
          { label: '增加/删除镜头', action: 'add_delete_shot' },
          { label: '调整镜头顺序', action: 'reorder_shots' },
          { label: '确认，生成分镜图', action: 'generate_storyboard' }
        ]);
      } else {
        addMessage('assistant', '还没有脚本，先上传或生成一个吧。');
        setOptions([
          { label: '上传脚本', action: 'upload_script' },
          { label: '让 AI 写脚本', action: 'generate_script' }
        ]);
      }
    } else if (opt.action === 'cancel') {
      // 取消操作
      setPendingMaterialChange(null);
      addMessage('assistant', '好的，不换了。还需要什么帮助吗？');
      // 恢复分镜阶段的默认选项
      if (hasStoryboard()) {
        setOptions([
          { label: '修改脚本', action: 'edit_script' },
          { label: '全部重新生成', action: 'regenerate_all' },
          { label: '导出分镜', action: 'export' }
        ]);
      } else {
        setOptions([]);
      }
    } else if (opt.action === 'regenerate_selected') {
      // 只重新生成受影响的帧（模特相关）
      const modelFrames = detectModelFrames();
      if (modelFrames.length > 0 && workflow.script) {
        addMessage('assistant', `正在重新生成第 ${modelFrames.join('、')} 帧...`);
        handleRegenerateSelectedFrames(modelFrames);
      }
    } else if (opt.action === 'export') {
      // 导出分镜图
      handleExportStoryboard();
    } else {
      handleUserAction(opt.label);
    }
  };

  const onNodeAction = (action: string, payload?: any) => {
    if (action === 'REGENERATE_PRODUCT') {
      // v3.12: 传递自定义描述参数
      handleRegenerateProductRef(payload?.customDescription);
    } else if (action === 'REGENERATE_MODEL') {
      // v3.12: 传递自定义描述参数
      handleRegenerateModelRef(payload?.customDescription);
    } else if (action === 'SAVE_MODEL_TO_LIBRARY') {
      // 保存模特到模特库
      if (workflow.modelRefImage && workflow.modelFeatures) {
        const modelName = `模特 ${new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
        const newModel: SavedModel = {
          id: `model_${Date.now()}`,
          name: modelName,
          refImage: workflow.modelRefImage,
          features: workflow.modelFeatures,
          createdAt: Date.now(),
        };
        handleSaveModelToLibrary(newModel);
      }
    } else if (action === 'DOWNLOAD_PRODUCT_REF') {
      // 下载产品参考图
      handleDownloadProductRef();
    } else if (action === 'DOWNLOAD_MODEL_REF') {
      // 下载模特参考图
      handleDownloadModelRef();
    } else if (action === 'DOWNLOAD_SCRIPT') {
      // 下载脚本 Markdown
      handleDownloadScript();
    } else if (action === 'DOWNLOAD_FRAME') {
      // 下载单帧分镜图
      if (payload?.shotNumber) {
        handleDownloadFrame(payload.shotNumber);
      }
    } else if (action === 'PACKAGE_DOWNLOAD') {
      // 打包下载全部素材
      handlePackageDownload();
    } else if (action === 'EDIT_SCRIPT') {
      // Canvas 上点击脚本编辑按钮
      if (workflow.script) {
        addMessage('assistant', '你想怎么修改脚本？');
        setOptions([
          { label: '修改镜头描述', action: 'edit_shot_description' },
          { label: '增加/删除镜头', action: 'add_delete_shot' },
          { label: '调整镜头顺序', action: 'reorder_shots' },
          { label: '确认，生成分镜图', action: 'generate_storyboard' }
        ]);
      }
    } else if (action === 'EDIT_SHOT') {
      // 点击脚本中的某个镜头，打开编辑 Modal
      const shot = workflow.script?.shots[payload.shotIndex];
      if (shot) {
        setShotEditModal({
          isOpen: true,
          shot,
          shotIndex: payload.shotIndex,
        });
      }
    } else if (action === 'EDIT_FRAME') {
      const shot = workflow.script?.shots[payload.shotIndex];
      if (shot) {
        setFrameEditModal({
          isOpen: true,
          shot,
          shotIndex: payload.shotIndex,
          isRegenerating: false,
        });
      }
    }
  };

  const handleFrameEdit = async (shotIndex: number, newDescription: string) => {
    if (!workflow.script) return;

    setFrameEditModal(prev => ({ ...prev, isRegenerating: true }));

    const newShots = [...workflow.script.shots];
    newShots[shotIndex] = {
      ...newShots[shotIndex],
      description: newDescription,
      imageUrl: undefined,
      isGenerating: true,
    };
    updateWorkflow({ script: { ...workflow.script, shots: newShots } });

    try {
      const prompt = await gemini.generateShotPrompt(
        newDescription,
        newShots[shotIndex].shotType,
        newShots[shotIndex].cameraMove,
        workflow.productFeatures!,
        workflow.modelFeatures
      );

      // 传入参考图以保持视觉一致性
      const imageUrl = await gemini.generateStoryboardFrame(
        prompt,
        workflow.productRefImage,
        workflow.modelRefImage
      );

      const updatedShots = [...newShots];
      updatedShots[shotIndex] = {
        ...updatedShots[shotIndex],
        prompt,
        imageUrl,
        isGenerating: false,
      };
      updateWorkflow({ script: { ...workflow.script, shots: updatedShots } });

      setFrameEditModal({
        isOpen: false,
        shot: null,
        shotIndex: -1,
        isRegenerating: false,
      });

      addMessage('assistant', `第 ${shotIndex + 1} 帧已重新生成！`);
    } catch (e) {
      console.error('Frame regeneration error:', e);
      addMessage('assistant', '重新生成分镜图失败，请重试。');
      setFrameEditModal(prev => ({ ...prev, isRegenerating: false }));
    }
  };

  // 编辑脚本镜头
  const handleShotEdit = (shotIndex: number, updatedShot: Partial<Shot>) => {
    if (!workflow.script) return;

    const newShots = [...workflow.script.shots];
    newShots[shotIndex] = {
      ...newShots[shotIndex],
      ...updatedShot,
    };
    updateWorkflow({ script: { ...workflow.script, shots: newShots } });
    addMessage('assistant', `镜头 ${shotIndex + 1} 已更新。`);
  };

  // 删除脚本镜头
  const handleShotDelete = (shotIndex: number) => {
    if (!workflow.script || workflow.script.shots.length <= 1) return;

    const newShots = workflow.script.shots.filter((_, idx) => idx !== shotIndex);
    // 重新编号
    const renumberedShots = newShots.map((shot, idx) => ({
      ...shot,
      shotNumber: idx + 1,
    }));
    updateWorkflow({ script: { ...workflow.script, shots: renumberedShots } });
    addMessage('assistant', `镜头 ${shotIndex + 1} 已删除，剩余 ${renumberedShots.length} 个镜头。`);
  };


  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] overflow-hidden font-sans text-white">
      {/* Hidden File Input for Triggers */}
      <input
        id="file-upload-trigger"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={onUpload}
      />

      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSettingsClick={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Content */}
      {currentView === 'home' ? (
        <Home
          projects={projects}
          onNewProject={createNewProject}
          onOpenProject={(id) => {
            const project = projects.find(p => p.id === id);
            if (project) openProject(project);
          }}
          onDeleteProject={deleteProject}
        />
      ) : currentView === 'models' ? (
        <ModelLibrary
          models={savedModels}
          onSelect={handleModelSelect}
          onDelete={handleModelDelete}
          onRename={handleModelRename}
          onBack={() => setCurrentView(currentProjectId ? 'project' : 'home')}
        />
      ) : (
        <>
          {/* Chat Panel */}
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={onSend}
            onUpload={onUpload}
            options={options}
            onOptionClick={onOptionClick}
            isProcessing={isProcessing}
            onSettingsClick={() => setIsApiKeyModalOpen(true)}
            width={chatPanelWidth}
            projectName={getCurrentProjectName()}
            onProjectNameChange={handleProjectNameChange}
            recentModels={savedModels.slice(0, 3)}
            onModelSelect={(model) => {
              handleModelSelect(model);
              setIsModelsExpanded(false); // 选择后收起模特库
            }}
            onOpenModelLibrary={() => handleNavigate('models')}
            isModelsExpanded={isModelsExpanded}
            onModelsExpandedChange={setIsModelsExpanded}
          />

          {/* Resizer */}
          <div
            className="w-2 cursor-col-resize flex-shrink-0 bg-transparent"
            onMouseDown={handleResizeStart}
          />

          {/* Canvas */}
          <Canvas
            workflow={workflow}
            onNodeAction={onNodeAction}
            onFileDrop={(files) => handleUserAction('', files)}
            isStoryboardGenerating={isStoryboardGenerating}
            onStopStoryboard={handleStopStoryboard}
            onContinueStoryboard={handleContinueStoryboard}
          />
        </>
      )}

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={() => {
          setOptions([{ label: "上传产品图", action: "UPLOAD_PRODUCT_TRIGGER" }]);
        }}
      />

      <FrameEditModal
        isOpen={frameEditModal.isOpen}
        shot={frameEditModal.shot}
        shotIndex={frameEditModal.shotIndex}
        isRegenerating={frameEditModal.isRegenerating}
        onClose={() => setFrameEditModal({
          isOpen: false,
          shot: null,
          shotIndex: -1,
          isRegenerating: false,
        })}
        onSave={handleFrameEdit}
      />

      <ShotEditModal
        isOpen={shotEditModal.isOpen}
        shot={shotEditModal.shot}
        shotIndex={shotEditModal.shotIndex}
        totalShots={workflow.script?.shots.length || 0}
        onClose={() => setShotEditModal({
          isOpen: false,
          shot: null,
          shotIndex: -1,
        })}
        onSave={handleShotEdit}
        onDelete={handleShotDelete}
      />
    </div>
  );
};

// Util
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default App;
