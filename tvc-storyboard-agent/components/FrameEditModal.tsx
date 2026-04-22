import React, { useState, useEffect } from 'react';
import { X, Loader2, RotateCw } from 'lucide-react';
import { Shot } from '../types';

interface FrameEditModalProps {
  isOpen: boolean;
  shot: Shot | null;
  shotIndex: number;
  onClose: () => void;
  onSave: (shotIndex: number, newDescription: string) => void;
  isRegenerating?: boolean;
}

const FrameEditModal: React.FC<FrameEditModalProps> = ({
  isOpen,
  shot,
  shotIndex,
  onClose,
  onSave,
  isRegenerating = false,
}) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && shot) {
      setDescription(shot.description);
    }
  }, [isOpen, shot]);

  const handleSave = () => {
    if (description.trim() && description !== shot?.description) {
      onSave(shotIndex, description.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
  };

  if (!isOpen || !shot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#111111] rounded-3xl border border-[#2a2a2a] w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#222222]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#00FF88]/10 text-[#00FF88] text-sm font-medium rounded-full">
              镜头 {shot.shotNumber}
            </span>
            <h2 className="text-lg font-semibold text-white">编辑画面描述</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Frame Preview */}
          {shot.imageUrl && (
            <div className="relative w-full aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[#222222]">
              <img
                src={shot.imageUrl}
                alt={`Shot ${shot.shotNumber}`}
                className="w-full h-full object-cover"
              />
              {isRegenerating && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="w-10 h-10 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-300">重新生成中...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shot Info */}
          <div className="flex gap-3 flex-wrap">
            <span className="px-3 py-1.5 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-[#2a2a2a]">
              时长：{shot.duration}
            </span>
            <span className="px-3 py-1.5 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-[#2a2a2a]">
              景别：{shot.shotType}
            </span>
            <span className="px-3 py-1.5 bg-[#1a1a1a] text-gray-400 text-xs rounded-full border border-[#2a2a2a]">
              镜头运动：{shot.cameraMove}
            </span>
          </div>

          {/* Description Editor */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              画面描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述这个镜头的画面内容..."
              rows={4}
              className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/30 focus:border-[#00FF88]/50 resize-none transition-all text-[15px] leading-relaxed"
              disabled={isRegenerating}
            />
            <p className="text-xs text-gray-500">
              修改后会重新生成该帧分镜图。按 ⌘+Enter 快速保存。
            </p>
          </div>

          {/* Dialogue (if exists) */}
          {shot.dialogue && (
            <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222222]">
              <span className="text-xs text-gray-500 block mb-2">台词/旁白</span>
              <p className="text-sm text-gray-300 italic">"{shot.dialogue}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={isRegenerating}
            className="flex-1 py-3.5 px-4 bg-[#1a1a1a] hover:bg-[#252525] disabled:opacity-50 text-white font-medium rounded-xl transition-all border border-[#2a2a2a]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isRegenerating || !description.trim() || description === shot.description}
            className="flex-1 py-3.5 px-4 bg-[#00FF88] hover:bg-[#00DD77] disabled:bg-[#00FF88]/30 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {isRegenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <RotateCw size={18} />
                保存并重新生成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameEditModal;
