import React, { useState, useRef, useEffect } from 'react';
import { WorkflowState, Shot } from '../types';
import { Upload, Box, User as UserIcon, FileText, Image as ImageIcon, Play, Edit2, RotateCw, Plus, Minus, ZoomIn, BookmarkPlus, Download, Archive, Square, Maximize2 } from 'lucide-react';

interface CanvasProps {
  workflow: WorkflowState;
  onNodeAction: (action: string, payload?: any) => void;
  onFileDrop?: (files: File[]) => void;
  // v3.11: 分镜图生成控制
  isStoryboardGenerating?: boolean;
  onStopStoryboard?: () => void;
  onContinueStoryboard?: () => void;
}

// Node position type
interface NodePositions {
  start: { x: number; y: number };
  product: { x: number; y: number };
  model: { x: number; y: number };
  script: { x: number; y: number };
  storyboard: { x: number; y: number };
}

const Canvas: React.FC<CanvasProps> = ({ workflow, onNodeAction, onFileDrop, isStoryboardGenerating, onStopStoryboard, onContinueStoryboard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  // Touch pinch zoom state
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);

  // v3.12: 参考图描述编辑状态
  const [isEditingProductDetails, setIsEditingProductDetails] = useState(false);
  const [editedProductDetails, setEditedProductDetails] = useState('');
  const [isEditingModelDetails, setIsEditingModelDetails] = useState(false);
  const [editedModelDetails, setEditedModelDetails] = useState('');

  // Track previous workflow state for detecting new nodes
  const prevWorkflowRef = useRef<WorkflowState | null>(null);

  // Node dimensions constants (heights are approximate, based on actual rendered content)
  // v3.13: 所有节点宽度统一为 800px
  const NODE_SIZES = {
    start: { width: 300, height: 300 },
    product: { width: 800, height: 560 }, // v3.13: 统一宽度 800px
    model: { width: 800, height: 560 },  // v3.13: 统一宽度 800px
    script: { width: 800, height: 600 }, // v3.13: 统一宽度 800px
    storyboard: { width: 800, height: 500 }, // v3.13: 统一宽度 800px
  };

  // Node dragging state
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  // v3.13: 位置重新计算 - 所有节点宽度 800px，间距 80px
  const [nodePositions, setNodePositions] = useState<NodePositions>({
    start: { x: 0, y: 0 },
    product: { x: 400, y: 0 },
    model: { x: 400, y: 800 }, // 模特在产品下方（产品高度720 + 间距80）
    script: { x: 1280, y: 0 }, // v3.13: 400+800+80=1280
    storyboard: { x: 2160, y: 0 }, // v3.13: 1280+800+80=2160
  });

  // Track latest node positions to avoid stale closure
  const nodePositionsRef = useRef<NodePositions>(nodePositions);

  // 根据是否有产品图和模特图来调整布局
  useEffect(() => {
    const hasProduct = !!workflow.productRefImage;
    const hasModel = !!workflow.modelRefImage;
    const hasBoth = hasProduct && hasModel;

    setNodePositions(prev => {
      // 产品节点高度 720，模特节点高度 560（v3.8），间距 80
      const productHeight = 720;
      const modelHeight = 560; // v3.8: Character Reference Sheet 布局
      const gap = 80;

      // 如果只有模特没有产品，模特节点移到产品位置 (y=0)
      // 如果有产品，模特在产品下方
      const modelY = hasProduct ? productHeight + gap : 0;

      // 如果两个都有，脚本和分镜居中对齐（在两个节点的中间）
      // 两个节点总高度：productHeight + gap + modelHeight = 620 + 80 + 620 = 1320
      // 中心 y = 1320 / 2 = 660，脚本高度 600，所以 scriptY = 660 - 300 = 360
      const totalHeight = productHeight + gap + modelHeight;
      const scriptY = hasBoth ? (totalHeight - 600) / 2 : 0;
      const storyboardY = hasBoth ? (totalHeight - 500) / 2 : 0;

      return {
        ...prev,
        model: { x: 400, y: modelY },
        script: { x: 1280, y: scriptY }, // v3.13: 宽度800后调整 (400+800+80=1280)
        storyboard: { x: 2160, y: storyboardY }, // v3.13: 调整 (1280+800+80=2160)
      };
    });
  }, [workflow.productRefImage, workflow.modelRefImage]);

  // Keep ref in sync with state
  useEffect(() => {
    nodePositionsRef.current = nodePositions;
  }, [nodePositions]);

  // Get visible nodes based on current workflow state (uses ref for latest values)
  const getVisibleNodes = () => {
    const nodes: { id: string; x: number; y: number; width: number; height: number }[] = [];
    const positions = nodePositionsRef.current;

    if (workflow.step === 'start') {
      nodes.push({ id: 'start', ...positions.start, ...NODE_SIZES.start });
    }
    if (workflow.productRefImage) {
      nodes.push({ id: 'product', ...positions.product, ...NODE_SIZES.product });
    }
    if (workflow.modelRefImage) {
      nodes.push({ id: 'model', ...positions.model, ...NODE_SIZES.model });
    }
    if (workflow.step === 'script' || workflow.step === 'storyboard') {
      nodes.push({ id: 'script', ...positions.script, ...NODE_SIZES.script });
    }
    if (workflow.step === 'storyboard') {
      nodes.push({ id: 'storyboard', ...positions.storyboard, ...NODE_SIZES.storyboard });
    }

    return nodes;
  };

  // Fit all visible nodes in view
  const fitToView = (padding = 80) => {
    if (!containerRef.current) return;

    const nodes = getVisibleNodes();
    if (nodes.length === 0) return;

    const container = containerRef.current.getBoundingClientRect();

    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate scale to fit content with padding
    const scaleX = (container.width - padding * 2) / contentWidth;
    const scaleY = (container.height - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%

    // Calculate position to center the content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newX = container.width / 2 - centerX * newScale;
    const newY = container.height / 2 - centerY * newScale;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  // Focus on a specific node (zoom to fit node in viewport)
  const focusOnNode = (nodeId: string) => {
    if (!containerRef.current) return;

    const nodePos = nodePositionsRef.current[nodeId as keyof NodePositions];
    const nodeSize = NODE_SIZES[nodeId as keyof typeof NODE_SIZES];
    if (!nodePos || !nodeSize) return;

    const container = containerRef.current.getBoundingClientRect();
    const padding = 60;

    // Calculate scale to fit node with padding
    const scaleX = (container.width - padding * 2) / nodeSize.width;
    const scaleY = (container.height - padding * 2) / nodeSize.height;
    const newScale = Math.min(scaleX, scaleY, 1.2); // Allow slight zoom in for better visibility

    // Calculate position to center the node
    const nodeCenterX = nodePos.x + nodeSize.width / 2;
    const nodeCenterY = nodePos.y + nodeSize.height / 2;
    const newX = container.width / 2 - nodeCenterX * newScale;
    const newY = container.height / 2 - nodeCenterY * newScale;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  // Detect new nodes and trigger fitToView
  useEffect(() => {
    const prev = prevWorkflowRef.current;

    // Detect if a new node appeared
    const newNodeAppeared =
      (!prev?.productRefImage && workflow.productRefImage) ||
      (!prev?.modelRefImage && workflow.modelRefImage) ||
      (prev?.step !== 'script' && workflow.step === 'script') ||
      (prev?.step !== 'storyboard' && workflow.step === 'storyboard');

    if (newNodeAppeared) {
      // Wait for node positions to update, then fit to view
      setTimeout(() => {
        requestAnimationFrame(() => fitToView());
      }, 150);
    }

    prevWorkflowRef.current = { ...workflow };
  }, [workflow.productRefImage, workflow.modelRefImage, workflow.step, nodePositions]);

  // Handle Pan (canvas drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card')) return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle node dragging
    if (draggingNode) {
      const dx = (e.clientX - lastMousePos.x) / scale;
      const dy = (e.clientY - lastMousePos.y) / scale;

      // Mark as dragged if moved more than 5px from start
      if (dragStartPos && !hasDragged) {
        const totalDx = Math.abs(e.clientX - dragStartPos.x);
        const totalDy = Math.abs(e.clientY - dragStartPos.y);
        if (totalDx > 5 || totalDy > 5) {
          setHasDragged(true);
        }
      }

      setNodePositions(prev => ({
        ...prev,
        [draggingNode]: {
          x: prev[draggingNode as keyof NodePositions].x + dx,
          y: prev[draggingNode as keyof NodePositions].y + dy,
        },
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    // Handle canvas pan
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Check if it was a click (no significant movement) on a node
    if (draggingNode && !hasDragged && dragStartPos) {
      const dx = Math.abs(e.clientX - dragStartPos.x);
      const dy = Math.abs(e.clientY - dragStartPos.y);
      if (dx < 5 && dy < 5) {
        // It's a click, focus on the node
        focusOnNode(draggingNode);
      }
    }
    setIsDragging(false);
    setDraggingNode(null);
    setDragStartPos(null);
    setHasDragged(false);
  };

  // Reset drag state without triggering focus (for mouse leave)
  const handleMouseLeaveReset = () => {
    setIsDragging(false);
    setDraggingNode(null);
    setDragStartPos(null);
    setHasDragged(false);
  };

  // Node drag handlers
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  // Handle Zoom and Pan via wheel/trackpad
  const handleWheel = (e: React.WheelEvent) => {
    // Ctrl/Cmd + wheel = zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Reduced sensitivity: 0.97/1.03 instead of 0.9/1.1
      const delta = e.deltaY > 0 ? 0.97 : 1.03;
      setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5));
    } else {
      // Two-finger trackpad scroll = pan canvas
      e.preventDefault();
      setPosition(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Touch event handlers for pinch-to-zoom
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastPinchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance !== null) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (distance !== null) {
        // Reduced sensitivity for pinch zoom
        const delta = 1 + (distance - lastPinchDistance) * 0.002;
        setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5));
        setLastPinchDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    setLastPinchDistance(null);
  };

  // Prevent default browser pinch zoom on the canvas container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefaultZoom = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
    };

    const preventGestureZoom = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener('touchmove', preventDefaultZoom, { passive: false });
    container.addEventListener('gesturestart', preventGestureZoom);
    container.addEventListener('gesturechange', preventGestureZoom);
    container.addEventListener('gestureend', preventGestureZoom);

    return () => {
      container.removeEventListener('touchmove', preventDefaultZoom);
      container.removeEventListener('gesturestart', preventGestureZoom);
      container.removeEventListener('gesturechange', preventGestureZoom);
      container.removeEventListener('gestureend', preventGestureZoom);
    };
  }, []);

  // Handle Drag and Drop for file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (clientX <= rect.left || clientX >= rect.right || clientY <= rect.top || clientY >= rect.bottom) {
        setIsDragOver(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
    if (files.length > 0 && onFileDrop) {
      onFileDrop(files);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setPosition({ x: width / 2 - 150, y: height / 2 - 200 });
    }
  }, []);

  // --- Node Renderers ---

  const renderStartNode = () => (
    <div
      className="node-card absolute bg-[#111111] border-2 border-dashed border-[#333333] rounded-3xl p-10 flex flex-col items-center justify-center gap-4 w-[300px] h-[300px] hover:border-[#00FF88] transition-all cursor-move group"
      style={{ left: nodePositions.start.x, top: nodePositions.start.y }}
      onMouseDown={(e) => handleNodeDragStart('start', e)}
    >
      {/* Clickable upload area - stops propagation to allow click without drag */}
      <div
        className="flex flex-col items-center gap-4 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          document.getElementById('file-upload-trigger')?.click();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 bg-[#1a1a1a] rounded-2xl flex items-center justify-center group-hover:bg-[#00FF88]/10 transition-colors border border-[#2a2a2a] group-hover:border-[#00FF88]/30">
          <Upload size={36} className="text-gray-400 group-hover:text-[#00FF88]" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">开始创作</h3>
          <p className="text-gray-500 text-sm">上传产品图开始创作</p>
        </div>
      </div>
    </div>
  );

  const renderProductNode = () => {
    // v3.12: 获取产品描述显示文本
    const getProductDetailsText = () => {
      if (!workflow.productFeatures) return '';
      const f = workflow.productFeatures;
      return `${f.style}${f.material ? ` · ${f.material}` : ''}`;
    };

    // v3.12: 开始编辑
    const startEditingProduct = () => {
      setEditedProductDetails(getProductDetailsText());
      setIsEditingProductDetails(true);
    };

    // v3.12: 保存编辑
    const saveProductDetails = () => {
      setIsEditingProductDetails(false);
    };

    // v3.12: 检查描述是否被修改过
    const isProductDescriptionModified = editedProductDetails !== '' && editedProductDetails !== getProductDetailsText();

    return (
      <div
        className="node-card absolute bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6 w-[800px] cursor-move animate-fade-in"
        style={{ left: nodePositions.product.x, top: nodePositions.product.y }}
        onMouseDown={(e) => handleNodeDragStart('product', e)}
      >
        {/* Header - v3.12: 带背景边框样式按钮（与分镜图一致） */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00FF88]/10 rounded-lg flex items-center justify-center">
              <Box size={18} className="text-[#00FF88]" />
            </div>
            <span className="font-semibold text-white">产品参考图</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 下载按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNodeAction('DOWNLOAD_PRODUCT_REF');
              }}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#00FF88]/10 text-gray-400 hover:text-[#00FF88] text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border border-[#2a2a2a] hover:border-[#00FF88]/30"
            >
              <Download size={14} /> 下载
            </button>
            {/* 重新生成按钮 - 默认 disabled */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isProductDescriptionModified) {
                  onNodeAction('REGENERATE_PRODUCT', { customDescription: editedProductDetails });
                  // v3.16: 不重置编辑内容，保留用户输入的描述
                }
              }}
              disabled={!isProductDescriptionModified}
              className={`px-3 py-2 bg-[#1a1a1a] text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border ${
                isProductDescriptionModified
                  ? 'text-[#00FF88] border-[#00FF88]/30 hover:bg-[#00FF88]/10 hover:border-[#00FF88]/50 cursor-pointer'
                  : 'text-gray-600 border-[#2a2a2a] cursor-not-allowed'
              }`}
            >
              <RotateCw size={14} /> 重新生成
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Reference Image */}
          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">PRODUCT REFERENCE SHEET</h4>
            <div className="w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#222222]" style={{ aspectRatio: '2.5 / 1' }}>
              {workflow.productRefImage ? (
                <img src={workflow.productRefImage} alt="Product Grid" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">生成中...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Details - v3.12: 可编辑 */}
          {workflow.productFeatures && (
            <div>
              <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">PRODUCT DETAILS</h4>
              <div className="border-l-2 border-[#00FF88]/40 pl-4">
                {isEditingProductDetails ? (
                  <textarea
                    value={editedProductDetails}
                    onChange={(e) => setEditedProductDetails(e.target.value)}
                    onBlur={saveProductDetails}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveProductDetails();
                      }
                    }}
                    className="w-full bg-[#0a0a0a] text-gray-300 text-sm leading-relaxed p-2 rounded-lg border border-[#00FF88]/30 focus:outline-none focus:border-[#00FF88] resize-none"
                    rows={2}
                    autoFocus
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    className="text-gray-300 text-sm leading-relaxed cursor-text hover:bg-[#1a1a1a] p-2 -m-2 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingProduct();
                    }}
                    title="点击编辑"
                  >
                    {editedProductDetails || getProductDetailsText()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderModelNode = () => {
    // v3.12: 获取模特描述显示文本
    const getModelDetailsText = () => {
      if (!workflow.modelFeatures) return '';
      const f = workflow.modelFeatures;
      return `${f.vibe}${f.face?.shape ? ` · ${f.face.shape}` : ''}`;
    };

    // v3.12: 开始编辑
    const startEditingModel = () => {
      setEditedModelDetails(getModelDetailsText());
      setIsEditingModelDetails(true);
    };

    // v3.12: 保存编辑
    const saveModelDetails = () => {
      setIsEditingModelDetails(false);
    };

    // v3.12: 检查描述是否被修改过
    const isModelDescriptionModified = editedModelDetails !== '' && editedModelDetails !== getModelDetailsText();

    return (
      <div
        className="node-card absolute bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6 w-[800px] cursor-move animate-fade-in"
        style={{ left: nodePositions.model.x, top: nodePositions.model.y }}
        onMouseDown={(e) => handleNodeDragStart('model', e)}
      >
        {/* Header - v3.12: 带背景边框样式按钮（与分镜图一致） */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <UserIcon size={18} className="text-purple-400" />
            </div>
            <span className="font-semibold text-white">模特参考图</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 下载按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNodeAction('DOWNLOAD_MODEL_REF');
              }}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border border-[#2a2a2a] hover:border-purple-400/30"
            >
              <Download size={14} /> 下载
            </button>
            {/* 添加到模特库按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNodeAction('SAVE_MODEL_TO_LIBRARY');
              }}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border border-[#2a2a2a] hover:border-purple-400/30"
            >
              <BookmarkPlus size={14} /> 添加到模特库
            </button>
            {/* 重新生成按钮 - 默认 disabled */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isModelDescriptionModified) {
                  onNodeAction('REGENERATE_MODEL', { customDescription: editedModelDetails });
                  // v3.16: 不重置编辑内容，保留用户输入的描述
                }
              }}
              disabled={!isModelDescriptionModified}
              className={`px-3 py-2 bg-[#1a1a1a] text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border ${
                isModelDescriptionModified
                  ? 'text-purple-400 border-purple-400/30 hover:bg-purple-500/10 hover:border-purple-400/50 cursor-pointer'
                  : 'text-gray-600 border-[#2a2a2a] cursor-not-allowed'
              }`}
            >
              <RotateCw size={14} /> 重新生成
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Reference Image - v3.8 Character Reference Sheet (宽高比 2.5:1) */}
          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">CHARACTER REFERENCE SHEET</h4>
            <div className="w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#222222]" style={{ aspectRatio: '2.5 / 1' }}>
              {workflow.modelRefImage ? (
                <img src={workflow.modelRefImage} alt="Character Reference Sheet" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">生成中...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model Details - v3.12: 可编辑 */}
          {workflow.modelFeatures && (
            <div>
              <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">MODEL DETAILS</h4>
              <div className="border-l-2 border-purple-400/40 pl-4">
                {isEditingModelDetails ? (
                  <textarea
                    value={editedModelDetails}
                    onChange={(e) => setEditedModelDetails(e.target.value)}
                    onBlur={saveModelDetails}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveModelDetails();
                      }
                    }}
                    className="w-full bg-[#0a0a0a] text-gray-300 text-sm leading-relaxed p-2 rounded-lg border border-purple-400/30 focus:outline-none focus:border-purple-400 resize-none"
                    rows={2}
                    autoFocus
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    className="text-gray-300 text-sm leading-relaxed cursor-text hover:bg-[#1a1a1a] p-2 -m-2 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingModel();
                    }}
                    title="点击编辑"
                  >
                    {editedModelDetails || getModelDetailsText()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderScriptNode = () => (
    <div
      className="node-card absolute bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6 w-[800px] cursor-move animate-fade-in"
      style={{ left: nodePositions.script.x, top: nodePositions.script.y }}
      onMouseDown={(e) => handleNodeDragStart('script', e)}
    >
      {/* Header - v3.12: 带背景边框样式按钮（与分镜图一致） */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00FF88]/10 rounded-lg flex items-center justify-center">
            <FileText size={18} className="text-[#00FF88]" />
          </div>
          <span className="font-semibold text-white">广告脚本</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNodeAction('DOWNLOAD_SCRIPT')}
            className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#00FF88]/10 text-gray-400 hover:text-[#00FF88] text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border border-[#2a2a2a] hover:border-[#00FF88]/30"
          >
            <Download size={14} /> 下载
          </button>
          <button
            onClick={() => onNodeAction('EDIT_SCRIPT')}
            className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#00FF88]/10 text-gray-400 hover:text-[#00FF88] text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border border-[#2a2a2a] hover:border-[#00FF88]/30"
          >
            <Edit2 size={14} /> 编辑
          </button>
        </div>
      </div>

      {workflow.script ? (
        <div className="space-y-5">
          {/* Script Summary */}
          {workflow.script.productInfo && (
            <div>
              <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">SCRIPT SUMMARY</h4>
              <div className="border-l-2 border-[#00FF88]/40 pl-4">
                <p className="text-gray-300 text-sm leading-relaxed">{workflow.script.productInfo}</p>
              </div>
            </div>
          )}

          {/* Product & Cast - Two Column Grid */}
          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">PRODUCT & CAST</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Product Card */}
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Box size={16} className="text-[#00FF88]" />
                  <p className="text-white text-sm font-medium">产品</p>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {workflow.productFeatures
                    ? `${workflow.productFeatures.style || ''}${workflow.productFeatures.material ? ' · ' + workflow.productFeatures.material : ''}`
                    : '产品参考图已上传'}
                </p>
              </div>

              {/* Cast Card */}
              <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon size={16} className="text-purple-400" />
                  <p className="text-white text-sm font-medium">演员</p>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {workflow.hasModel && workflow.modelFeatures
                    ? `${workflow.modelFeatures.vibe || ''}${workflow.modelFeatures.face?.shape ? ' · ' + workflow.modelFeatures.face.shape : ''}`
                    : workflow.hasModel ? '模特参考图已上传' : '未添加模特'}
                </p>
              </div>
            </div>
          </div>

          {/* Storyboard Description - Shots List */}
          <div>
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">STORYBOARD DESCRIPTION</h4>
            <div className="space-y-3">
              {workflow.script.shots.map((shot, idx) => (
                <div
                  key={idx}
                  onClick={() => onNodeAction('EDIT_SHOT', { shotIndex: idx })}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="cursor-pointer group bg-[#0a0a0a] border border-[#222222] hover:border-[#00FF88]/30 rounded-xl p-3 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#00FF88] font-medium text-sm">Shot {shot.shotNumber}</span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-gray-500 text-xs">{shot.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#1a1a1a] text-gray-500 text-[10px] rounded">{shot.shotType}</span>
                      <span className="px-2 py-0.5 bg-[#1a1a1a] text-gray-500 text-[10px] rounded">{shot.cameraMove}</span>
                      <Edit2 size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{shot.description}</p>
                  {shot.dialogue && (
                    <p className="text-gray-500 text-sm mt-2 italic border-l-2 border-[#2a2a2a] pl-3">"{shot.dialogue}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600 py-10">
          <div className="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm">正在生成脚本...</span>
        </div>
      )}
    </div>
  );

  const renderStoryboardNode = () => {
    return (
      <div
        className="node-card absolute bg-[#111111] border border-[#2a2a2a] rounded-3xl p-6 w-[800px] cursor-move animate-fade-in"
        style={{ left: nodePositions.storyboard.x, top: nodePositions.storyboard.y }}
        onMouseDown={(e) => handleNodeDragStart('storyboard', e)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
              <ImageIcon size={18} className="text-pink-400" />
            </div>
            <span className="font-semibold text-white">分镜图</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNodeAction('PACKAGE_DOWNLOAD')}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-pink-500/10 text-gray-400 hover:text-pink-400 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors border border-[#2a2a2a] hover:border-pink-400/30"
              title="打包下载所有素材"
            >
              <Archive size={14} /> 打包下载
            </button>
            {/* v3.11: 停止/继续按钮 */}
            {(() => {
              const hasIncompleteFrames = workflow.script?.shots.some(shot => !shot.imageUrl);
              // 所有图都完成了，隐藏按钮
              if (!hasIncompleteFrames && !isStoryboardGenerating) return null;

              if (isStoryboardGenerating) {
                // 正在生成：显示停止按钮
                return (
                  <button
                    onClick={onStopStoryboard}
                    className="px-4 py-2 bg-[#00FF88] hover:bg-[#00DD77] text-black text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
                    title="停止生成"
                  >
                    <Square size={14} fill="currentColor" /> 停止
                  </button>
                );
              } else {
                // 未生成/已停止：显示继续按钮
                return (
                  <button
                    onClick={onContinueStoryboard}
                    className="px-4 py-2 bg-[#00FF88] hover:bg-[#00DD77] text-black text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
                    title="继续生成"
                  >
                    <Play size={14} /> 继续
                  </button>
                );
              }
            })()}
          </div>
        </div>

        {/* Generated Frames */}
        <div>
          <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">GENERATED FRAMES</h4>
          <div className="grid grid-cols-3 gap-3">
            {workflow.script?.shots.map((shot, idx) => (
              <div key={idx} className="group bg-[#0a0a0a] rounded-xl overflow-hidden border border-[#222222] hover:border-pink-400/50 transition-all">
                <div className="aspect-video bg-black relative">
                  {shot.imageUrl ? (
                    <img src={shot.imageUrl} alt={`镜头 ${shot.shotNumber}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                      {shot.isGenerating ? (
                        <>
                          <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">生成中...</span>
                        </>
                      ) : (
                        <span className="text-xs">等待中...</span>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-[10px] text-white font-medium">
                    Shot {shot.shotNumber}
                  </div>
                  {/* 下载按钮（悬停显示） */}
                  {shot.imageUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNodeAction('DOWNLOAD_FRAME', { shotNumber: shot.shotNumber });
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-gray-400 hover:text-pink-400 transition-colors opacity-0 group-hover:opacity-100"
                      title={`下载 Shot ${shot.shotNumber}`}
                    >
                      <Download size={14} />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 line-clamp-2 mb-2" title={shot.description}>
                    {shot.description}
                  </p>
                  <button
                    onClick={() => onNodeAction('EDIT_FRAME', { shotIndex: idx })}
                    className="w-full py-1.5 bg-[#1a1a1a] hover:bg-[#252525] text-gray-500 hover:text-white text-xs rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- SVG Connectors with flowing gradient animation ---
  const renderConnections = () => {
    // Card dimensions
    const nodeHeights = {
      start: 300,
      product: workflow.productFeatures ? 340 : 280,
      model: workflow.modelFeatures ? 340 : 280,
      script: workflow.script ? Math.max(400, 200 + (workflow.script.shots?.length || 0) * 120) : 200,
      storyboard: 400,
    };
    // v3.13: 统一宽度 800px
    const nodeWidths = {
      start: 300,
      product: 800,
      model: 800,
      script: 800,
      storyboard: 800,
    };

    // Get node center Y position (middle of card)
    const getNodeCenterY = (nodeId: keyof typeof nodeHeights, nodeY: number) => {
      return nodeY + nodeHeights[nodeId] / 2;
    };

    const elements: React.ReactNode[] = [];

    // v3.14: Helper to create a connection with flowing gradient animation
    const createConnection = (key: string, startX: number, startY: number, endX: number, endY: number, color: string = '#00FF88') => {
      // Calculate control points for smooth curve
      const ctrlOffset = Math.abs(endX - startX) * 0.4;
      const pathD = `M ${startX} ${startY} C ${startX + ctrlOffset} ${startY}, ${endX - ctrlOffset} ${endY}, ${endX} ${endY}`;
      const gradientId = `flow-gradient-${key}`;

      return (
        <g key={key}>
          {/* Background line (dark base) */}
          <path
            d={pathD}
            stroke="#2a2a2a"
            strokeWidth={2}
            fill="none"
          />
          {/* Flowing gradient line */}
          <path
            d={pathD}
            stroke={`url(#${gradientId})`}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
          {/* Start endpoint circle */}
          <circle cx={startX} cy={startY} r={5} fill="#1a1a1a" stroke={color} strokeWidth={2} opacity={0.6} />
          {/* End endpoint circle */}
          <circle cx={endX} cy={endY} r={5} fill="#1a1a1a" stroke={color} strokeWidth={2} opacity={0.6} />
        </g>
      );
    };

    // Product -> Script（产品直接连接到脚本，绿色流动）
    if (workflow.productRefImage && workflow.script) {
      const startX = nodePositions.product.x + nodeWidths.product;
      const startY = getNodeCenterY('product', nodePositions.product.y);
      const endX = nodePositions.script.x;
      const endY = getNodeCenterY('script', nodePositions.script.y);
      elements.push(createConnection('p-s', startX, startY, endX, endY, '#00FF88'));
    }

    // Model -> Script（模特直接连接到脚本，紫色流动）
    if (workflow.modelRefImage && workflow.script) {
      const startX = nodePositions.model.x + nodeWidths.model;
      const startY = getNodeCenterY('model', nodePositions.model.y);
      const endX = nodePositions.script.x;
      const endY = getNodeCenterY('script', nodePositions.script.y);
      elements.push(createConnection('m-s', startX, startY, endX, endY, '#a855f7'));
    }

    // Script -> Storyboard（绿色流动）
    if (workflow.script && workflow.step === 'storyboard') {
      const startX = nodePositions.script.x + nodeWidths.script;
      const startY = getNodeCenterY('script', nodePositions.script.y);
      const endX = nodePositions.storyboard.x;
      const endY = getNodeCenterY('storyboard', nodePositions.storyboard.y);
      elements.push(createConnection('s-sb', startX, startY, endX, endY, '#00FF88'));
    }

    return (
      <svg className="absolute top-0 left-0 w-[5000px] h-[3000px] pointer-events-none -z-10 overflow-visible">
        {/* v3.14: SVG Flowing Gradient Definitions */}
        <defs>
          {/* Product -> Script 流动渐变（绿色） */}
          <linearGradient id="flow-gradient-p-s" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2a2a2a">
              <animate attributeName="stop-color" values="#2a2a2a;#00FF88;#2a2a2a" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="#00FF88">
              <animate attributeName="stop-color" values="#00FF88;#2a2a2a;#00FF88" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="#2a2a2a">
              <animate attributeName="stop-color" values="#2a2a2a;#00FF88;#2a2a2a" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#00FF88">
              <animate attributeName="stop-color" values="#00FF88;#2a2a2a;#00FF88" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          {/* Model -> Script 流动渐变（紫色） */}
          <linearGradient id="flow-gradient-m-s" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2a2a2a">
              <animate attributeName="stop-color" values="#2a2a2a;#a855f7;#2a2a2a" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="#a855f7">
              <animate attributeName="stop-color" values="#a855f7;#2a2a2a;#a855f7" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="#2a2a2a">
              <animate attributeName="stop-color" values="#2a2a2a;#a855f7;#2a2a2a" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#a855f7">
              <animate attributeName="stop-color" values="#a855f7;#2a2a2a;#a855f7" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          {/* Script -> Storyboard 流动渐变（绿色） */}
          <linearGradient id="flow-gradient-s-sb" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2a2a2a">
              <animate attributeName="stop-color" values="#2a2a2a;#00FF88;#2a2a2a" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="30%" stopColor="#00FF88">
              <animate attributeName="stop-color" values="#00FF88;#2a2a2a;#00FF88" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="60%" stopColor="#2a2a2a">
              <animate attributeName="stop-color" values="#2a2a2a;#00FF88;#2a2a2a" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#00FF88">
              <animate attributeName="stop-color" values="#00FF88;#2a2a2a;#00FF88" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        {elements}
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#0a0a0a] relative overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeaveReset}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: 'radial-gradient(circle, #333333 1px, transparent 1px)',
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`
        }}
      />

      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: 'transform 400ms ease-out'
        }}
      >
        {renderConnections()}
        {workflow.step === 'start' && renderStartNode()}
        {workflow.productRefImage && renderProductNode()}
        {workflow.modelRefImage && renderModelNode()}
        {(workflow.step === 'script' || workflow.step === 'storyboard') && renderScriptNode()}
        {workflow.step === 'storyboard' && renderStoryboardNode()}
      </div>

      {/* Canvas Controls - v3.19: 添加 100% 和 Fit 功能 */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl flex items-center overflow-hidden">
          <button
            onClick={() => setScale(prev => Math.max(prev * 0.9, 0.1))}
            className="p-2.5 hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors border-r border-[#2a2a2a]"
            title="缩小"
          >
            <Minus size={16} />
          </button>
          {/* 点击百分比回到 100% */}
          <button
            onClick={() => setScale(1)}
            className="px-4 py-2 text-white text-sm font-medium min-w-[60px] text-center hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            title="重置为 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => setScale(prev => Math.min(prev * 1.1, 5))}
            className="p-2.5 hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors border-l border-[#2a2a2a]"
            title="放大"
          >
            <Plus size={16} />
          </button>
          {/* Fit to View 按钮 */}
          <button
            onClick={() => fitToView()}
            className="p-2.5 hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors border-l border-[#2a2a2a]"
            title="适应所有节点"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-[#00FF88]/10 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-[#111111] border-2 border-dashed border-[#00FF88] rounded-3xl p-12 flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-[#00FF88]/10 rounded-2xl flex items-center justify-center">
              <Upload size={40} className="text-[#00FF88]" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">拖放图片上传</h3>
              <p className="text-gray-400 text-sm">松开鼠标即可上传产品图片</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
