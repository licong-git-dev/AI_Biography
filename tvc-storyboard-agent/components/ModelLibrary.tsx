import React, { useState } from 'react';
import { SavedModel } from '../types';
import { Trash2, Pencil, Check, X, ArrowLeft } from 'lucide-react';

// Mosaic Style SVG Decorations - Purple Theme
const MosaicPerson = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
    {/* Head */}
    <rect x="9" y="2" width="2" height="2" fill="#A855F7" opacity="0.9" />
    <rect x="11" y="2" width="2" height="2" fill="#9333EA" opacity="0.8" />
    <rect x="9" y="4" width="2" height="2" fill="#9333EA" opacity="0.8" />
    <rect x="11" y="4" width="2" height="2" fill="#A855F7" opacity="0.9" />
    <rect x="13" y="2" width="2" height="2" fill="#A855F7" opacity="0.7" />
    <rect x="13" y="4" width="2" height="2" fill="#9333EA" opacity="0.6" />

    {/* Body */}
    <rect x="7" y="8" width="2" height="2" fill="#A855F7" opacity="0.7" />
    <rect x="9" y="8" width="2" height="2" fill="#9333EA" opacity="0.8" />
    <rect x="11" y="8" width="2" height="2" fill="#A855F7" opacity="0.9" />
    <rect x="13" y="8" width="2" height="2" fill="#9333EA" opacity="0.7" />
    <rect x="15" y="8" width="2" height="2" fill="#A855F7" opacity="0.6" />

    <rect x="7" y="10" width="2" height="2" fill="#9333EA" opacity="0.6" />
    <rect x="9" y="10" width="2" height="2" fill="#A855F7" opacity="0.8" />
    <rect x="11" y="10" width="2" height="2" fill="#9333EA" opacity="0.9" />
    <rect x="13" y="10" width="2" height="2" fill="#A855F7" opacity="0.8" />
    <rect x="15" y="10" width="2" height="2" fill="#9333EA" opacity="0.5" />

    <rect x="9" y="12" width="2" height="2" fill="#222222" />
    <rect x="11" y="12" width="2" height="2" fill="#1a1a1a" />
    <rect x="13" y="12" width="2" height="2" fill="#222222" />

    {/* Legs */}
    <rect x="9" y="14" width="2" height="4" fill="#1a1a1a" />
    <rect x="13" y="14" width="2" height="4" fill="#1a1a1a" />
  </svg>
);

const MosaicCamera = () => (
  <svg width="80" height="80" viewBox="0 0 20 20" fill="none">
    {/* Camera body */}
    <rect x="2" y="6" width="3" height="3" fill="#A855F7" opacity="0.8" />
    <rect x="5" y="6" width="3" height="3" fill="#9333EA" opacity="0.7" />
    <rect x="8" y="6" width="3" height="3" fill="#A855F7" opacity="0.6" />
    <rect x="2" y="9" width="3" height="3" fill="#9333EA" opacity="0.7" />
    <rect x="5" y="9" width="3" height="3" fill="#A855F7" opacity="0.9" />
    <rect x="8" y="9" width="3" height="3" fill="#9333EA" opacity="0.8" />
    <rect x="2" y="12" width="3" height="3" fill="#A855F7" opacity="0.6" />
    <rect x="5" y="12" width="3" height="3" fill="#9333EA" opacity="0.8" />
    <rect x="8" y="12" width="3" height="3" fill="#A855F7" opacity="0.7" />
    {/* Lens */}
    <rect x="12" y="8" width="3" height="3" fill="#333333" />
    <rect x="15" y="8" width="2" height="3" fill="#444444" />
    <rect x="12" y="11" width="3" height="2" fill="#2a2a2a" />
  </svg>
);

const MosaicHeart = () => (
  <svg width="60" height="60" viewBox="0 0 16 16" fill="none">
    {/* Heart shape mosaic */}
    <rect x="2" y="4" width="2" height="2" fill="#A855F7" opacity="0.8" />
    <rect x="4" y="2" width="2" height="2" fill="#A855F7" opacity="0.9" />
    <rect x="4" y="4" width="2" height="2" fill="#9333EA" opacity="0.9" />
    <rect x="10" y="2" width="2" height="2" fill="#A855F7" opacity="0.9" />
    <rect x="10" y="4" width="2" height="2" fill="#9333EA" opacity="0.9" />
    <rect x="12" y="4" width="2" height="2" fill="#A855F7" opacity="0.8" />
    <rect x="2" y="6" width="2" height="2" fill="#9333EA" opacity="0.7" />
    <rect x="4" y="6" width="2" height="2" fill="#A855F7" opacity="0.8" />
    <rect x="6" y="4" width="2" height="2" fill="#9333EA" opacity="0.7" />
    <rect x="8" y="4" width="2" height="2" fill="#9333EA" opacity="0.7" />
    <rect x="10" y="6" width="2" height="2" fill="#A855F7" opacity="0.8" />
    <rect x="12" y="6" width="2" height="2" fill="#9333EA" opacity="0.7" />
    <rect x="4" y="8" width="2" height="2" fill="#9333EA" opacity="0.6" />
    <rect x="6" y="6" width="4" height="2" fill="#A855F7" opacity="0.9" />
    <rect x="6" y="8" width="4" height="2" fill="#9333EA" opacity="0.8" />
    <rect x="10" y="8" width="2" height="2" fill="#9333EA" opacity="0.6" />
    <rect x="6" y="10" width="4" height="2" fill="#A855F7" opacity="0.7" />
    <rect x="7" y="12" width="2" height="2" fill="#9333EA" opacity="0.6" />
  </svg>
);

const MosaicStar = () => (
  <svg width="40" height="40" viewBox="0 0 12 12" fill="none">
    <rect x="5" y="0" width="2" height="2" fill="#A855F7" opacity="0.9" />
    <rect x="3" y="2" width="2" height="2" fill="#A855F7" opacity="0.7" />
    <rect x="7" y="2" width="2" height="2" fill="#A855F7" opacity="0.7" />
    <rect x="0" y="4" width="2" height="2" fill="#A855F7" opacity="0.5" />
    <rect x="5" y="4" width="2" height="2" fill="#A855F7" opacity="1" />
    <rect x="10" y="4" width="2" height="2" fill="#A855F7" opacity="0.5" />
    <rect x="3" y="6" width="2" height="2" fill="#A855F7" opacity="0.6" />
    <rect x="7" y="6" width="2" height="2" fill="#A855F7" opacity="0.6" />
    <rect x="1" y="8" width="2" height="2" fill="#A855F7" opacity="0.4" />
    <rect x="9" y="8" width="2" height="2" fill="#A855F7" opacity="0.4" />
  </svg>
);

interface ModelLibraryProps {
  models: SavedModel[];
  onSelect: (model: SavedModel) => void;
  onDelete: (modelId: string) => void;
  onRename: (modelId: string, newName: string) => void;
  onBack: () => void;
}

// v3.20: 删除确认
const ModelLibrary: React.FC<ModelLibraryProps> = ({
  models,
  onSelect,
  onDelete,
  onRename,
  onBack
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleStartEdit = (model: SavedModel) => {
    setEditingId(model.id);
    setEditedName(model.name);
  };

  const handleSaveEdit = (modelId: string) => {
    if (editedName.trim()) {
      onRename(modelId, editedName.trim());
    }
    setEditingId(null);
    setEditedName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedName('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 bg-[#0a0a0a] overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a] z-10">
        <div className="px-8 py-6 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#1a1a1a] rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">模特库</h1>
            <p className="text-gray-500 text-sm mt-1">{models.length} 个模特</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={models.length === 0 ? "flex-1 flex items-center justify-center" : "p-8"}>
        {models.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center">
            {/* Decorative mosaic illustrations */}
            <div className="relative mb-8">
              <div className="absolute -top-8 -left-16 opacity-60">
                <MosaicHeart />
              </div>
              <div className="absolute -top-4 -right-20 opacity-50">
                <MosaicCamera />
              </div>
              <div className="absolute top-20 -left-24 opacity-40">
                <MosaicStar />
              </div>
              <div className="absolute top-16 -right-16 opacity-40">
                <MosaicStar />
              </div>
              <MosaicPerson />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">还没有保存的模特</h2>
            <p className="text-gray-500 text-center max-w-md mb-4">
              在项目中生成模特参考图后，<br />
              点击「保存到模特库」即可保存到这里。
            </p>
          </div>
        ) : (
          /* Model Grid - v3.18: 沉浸式大图风格 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {models.map(model => (
              <div
                key={model.id}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                onClick={() => !editingId && onSelect(model)}
              >
                {/* 全幅背景图 */}
                <div
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${model.refImage})`,
                    backgroundSize: '400%',
                    backgroundPosition: '0% 15%',
                  }}
                />

                {/* 底部渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* 删除确认遮罩 - v3.20 */}
                {deleteConfirmId === model.id && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20" onClick={(e) => e.stopPropagation()}>
                    <p className="text-white text-sm font-medium">确定删除此模特？</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                        className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white text-sm rounded-lg transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(model.id); setDeleteConfirmId(null); }}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}

                {/* 顶部操作按钮 */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartEdit(model); }}
                    className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-xl text-gray-300 hover:text-white transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(model.id); }}
                    className="p-2 bg-black/60 backdrop-blur-sm hover:bg-red-500/80 rounded-xl text-gray-300 hover:text-white transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 底部信息区 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  {editingId === model.id ? (
                    /* 编辑模式 */
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(model.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        className="flex-1 bg-black/60 backdrop-blur-sm border border-purple-500/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleSaveEdit(model.id)}
                        className="p-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 bg-black/60 hover:bg-black/80 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* 显示模式 */
                    <>
                      <h3 className="font-semibold text-white text-lg mb-1 drop-shadow-lg">
                        {model.name}
                      </h3>
                      {model.features?.vibe && (
                        <p className="text-gray-300 text-sm line-clamp-2 drop-shadow-md">
                          {model.features.vibe}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* 悬浮时的选择按钮 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="px-6 py-3 bg-purple-500/90 backdrop-blur-sm hover:bg-purple-500 text-white font-medium rounded-xl transition-all shadow-lg"
                    onClick={() => onSelect(model)}
                  >
                    选择使用
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelLibrary;
