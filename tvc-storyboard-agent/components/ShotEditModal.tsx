import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Shot } from '../types';

interface ShotEditModalProps {
  isOpen: boolean;
  shot: Shot | null;
  shotIndex: number;
  totalShots: number;
  onClose: () => void;
  onSave: (shotIndex: number, updatedShot: Partial<Shot>) => void;
  onDelete?: (shotIndex: number) => void;
}

const SHOT_TYPES = ['特写', '近景', '中景', '中全景', '全景', '远景'];
const CAMERA_MOVES = ['固定', '推', '拉', '摇', '移', '跟', '升', '降', '甩'];

const ShotEditModal: React.FC<ShotEditModalProps> = ({
  isOpen,
  shot,
  shotIndex,
  totalShots,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    duration: '',
    shotType: '',
    cameraMove: '',
    dialogue: '',
  });

  useEffect(() => {
    if (isOpen && shot) {
      setFormData({
        description: shot.description || '',
        duration: shot.duration || '',
        shotType: shot.shotType || '',
        cameraMove: shot.cameraMove || '',
        dialogue: shot.dialogue || '',
      });
    }
  }, [isOpen, shot]);

  const handleSave = () => {
    onSave(shotIndex, {
      description: formData.description.trim(),
      duration: formData.duration.trim(),
      shotType: formData.shotType,
      cameraMove: formData.cameraMove,
      dialogue: formData.dialogue.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && confirm(`确定要删除镜头 ${shotIndex + 1} 吗？`)) {
      onDelete(shotIndex);
      onClose();
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
      <div className="relative bg-[#111111] rounded-3xl border border-[#2a2a2a] w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#222222] shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#00FF88]/10 text-[#00FF88] text-sm font-medium rounded-full">
              镜头 {shot.shotNumber}
            </span>
            <h2 className="text-lg font-semibold text-white">编辑镜头</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              画面描述 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={handleKeyDown}
              placeholder="描述这个镜头的画面内容..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/30 focus:border-[#00FF88]/50 resize-none transition-all text-[15px]"
            />
          </div>

          {/* Duration & Shot Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                时长
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="例如：3s"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/30 focus:border-[#00FF88]/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                景别
              </label>
              <select
                value={formData.shotType}
                onChange={(e) => setFormData(prev => ({ ...prev, shotType: e.target.value }))}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#00FF88]/30 focus:border-[#00FF88]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="">选择景别</option>
                {SHOT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Camera Move */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              镜头运动
            </label>
            <div className="flex flex-wrap gap-2">
              {CAMERA_MOVES.map(move => (
                <button
                  key={move}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, cameraMove: move }))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    formData.cameraMove === move
                      ? 'bg-[#00FF88] text-black font-medium'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-white border border-[#2a2a2a]'
                  }`}
                >
                  {move}
                </button>
              ))}
            </div>
          </div>

          {/* Dialogue */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              台词/旁白 <span className="text-gray-500 font-normal">(可选)</span>
            </label>
            <input
              type="text"
              value={formData.dialogue}
              onChange={(e) => setFormData(prev => ({ ...prev, dialogue: e.target.value }))}
              placeholder="例如：每一天，都值得被温柔对待"
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/30 focus:border-[#00FF88]/50 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-3 shrink-0">
          {onDelete && totalShots > 1 && (
            <button
              onClick={handleDelete}
              className="p-3.5 bg-[#1a1a1a] hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all border border-[#2a2a2a] hover:border-red-500/30"
              title="删除此镜头"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 bg-[#1a1a1a] hover:bg-[#252525] text-white font-medium rounded-xl transition-all border border-[#2a2a2a]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.description.trim()}
            className="flex-1 py-3.5 px-4 bg-[#00FF88] hover:bg-[#00DD77] disabled:bg-[#00FF88]/30 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShotEditModal;
