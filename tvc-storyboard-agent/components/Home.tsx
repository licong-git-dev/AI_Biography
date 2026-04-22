import React, { useState } from 'react';
import { Plus, Clock, Trash2, Play } from 'lucide-react';

// Types
export interface Project {
  id: string;
  name: string;
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
}

interface HomeProps {
  projects: Project[];
  onNewProject: () => void;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

// Mosaic Style SVG Decorations
const MosaicClapperboard = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
    {/* Clapperboard body - mosaic style */}
    <rect x="2" y="8" width="4" height="4" fill="#00FF88" opacity="0.9" />
    <rect x="6" y="8" width="4" height="4" fill="#00DD77" opacity="0.8" />
    <rect x="10" y="8" width="4" height="4" fill="#00FF88" opacity="0.7" />
    <rect x="14" y="8" width="4" height="4" fill="#00BB66" opacity="0.8" />
    <rect x="18" y="8" width="4" height="4" fill="#00FF88" opacity="0.6" />

    <rect x="2" y="12" width="4" height="4" fill="#1a1a1a" />
    <rect x="6" y="12" width="4" height="4" fill="#222222" />
    <rect x="10" y="12" width="4" height="4" fill="#1a1a1a" />
    <rect x="14" y="12" width="4" height="4" fill="#222222" />
    <rect x="18" y="12" width="4" height="4" fill="#1a1a1a" />

    <rect x="2" y="16" width="4" height="4" fill="#222222" />
    <rect x="6" y="16" width="4" height="4" fill="#1a1a1a" />
    <rect x="10" y="16" width="4" height="4" fill="#222222" />
    <rect x="14" y="16" width="4" height="4" fill="#1a1a1a" />
    <rect x="18" y="16" width="4" height="4" fill="#222222" />

    {/* Top clapper - diagonal stripes mosaic */}
    <rect x="2" y="4" width="2" height="4" fill="#00FF88" />
    <rect x="4" y="4" width="2" height="4" fill="#111111" />
    <rect x="6" y="4" width="2" height="4" fill="#00FF88" />
    <rect x="8" y="4" width="2" height="4" fill="#111111" />
    <rect x="10" y="4" width="2" height="4" fill="#00FF88" />
    <rect x="12" y="4" width="2" height="4" fill="#111111" />
    <rect x="14" y="4" width="2" height="4" fill="#00FF88" />
    <rect x="16" y="4" width="2" height="4" fill="#111111" />
    <rect x="18" y="4" width="2" height="4" fill="#00FF88" />
    <rect x="20" y="4" width="2" height="4" fill="#111111" />
  </svg>
);

const MosaicCamera = () => (
  <svg width="80" height="80" viewBox="0 0 20 20" fill="none">
    {/* Camera body */}
    <rect x="2" y="6" width="3" height="3" fill="#00FF88" opacity="0.8" />
    <rect x="5" y="6" width="3" height="3" fill="#00DD77" opacity="0.7" />
    <rect x="8" y="6" width="3" height="3" fill="#00FF88" opacity="0.6" />
    <rect x="2" y="9" width="3" height="3" fill="#00BB66" opacity="0.7" />
    <rect x="5" y="9" width="3" height="3" fill="#00FF88" opacity="0.9" />
    <rect x="8" y="9" width="3" height="3" fill="#00DD77" opacity="0.8" />
    <rect x="2" y="12" width="3" height="3" fill="#00FF88" opacity="0.6" />
    <rect x="5" y="12" width="3" height="3" fill="#00BB66" opacity="0.8" />
    <rect x="8" y="12" width="3" height="3" fill="#00FF88" opacity="0.7" />
    {/* Lens */}
    <rect x="12" y="8" width="3" height="3" fill="#333333" />
    <rect x="15" y="8" width="2" height="3" fill="#444444" />
    <rect x="12" y="11" width="3" height="2" fill="#2a2a2a" />
  </svg>
);

const MosaicFilm = () => (
  <svg width="60" height="60" viewBox="0 0 16 16" fill="none">
    {/* Film strip */}
    <rect x="2" y="2" width="2" height="2" fill="#00FF88" opacity="0.9" />
    <rect x="2" y="6" width="2" height="2" fill="#00FF88" opacity="0.7" />
    <rect x="2" y="10" width="2" height="2" fill="#00FF88" opacity="0.8" />
    <rect x="12" y="2" width="2" height="2" fill="#00FF88" opacity="0.8" />
    <rect x="12" y="6" width="2" height="2" fill="#00FF88" opacity="0.9" />
    <rect x="12" y="10" width="2" height="2" fill="#00FF88" opacity="0.7" />
    {/* Center frames */}
    <rect x="5" y="2" width="6" height="4" fill="#222222" />
    <rect x="5" y="8" width="6" height="4" fill="#1a1a1a" />
  </svg>
);

const MosaicStar = () => (
  <svg width="40" height="40" viewBox="0 0 12 12" fill="none">
    <rect x="5" y="0" width="2" height="2" fill="#00FF88" opacity="0.9" />
    <rect x="3" y="2" width="2" height="2" fill="#00FF88" opacity="0.7" />
    <rect x="7" y="2" width="2" height="2" fill="#00FF88" opacity="0.7" />
    <rect x="0" y="4" width="2" height="2" fill="#00FF88" opacity="0.5" />
    <rect x="5" y="4" width="2" height="2" fill="#00FF88" opacity="1" />
    <rect x="10" y="4" width="2" height="2" fill="#00FF88" opacity="0.5" />
    <rect x="3" y="6" width="2" height="2" fill="#00FF88" opacity="0.6" />
    <rect x="7" y="6" width="2" height="2" fill="#00FF88" opacity="0.6" />
    <rect x="1" y="8" width="2" height="2" fill="#00FF88" opacity="0.4" />
    <rect x="9" y="8" width="2" height="2" fill="#00FF88" opacity="0.4" />
  </svg>
);

// Empty State Component
const EmptyState = ({ onNewProject }: { onNewProject: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full">
    {/* Decorative mosaic illustrations */}
    <div className="relative mb-8">
      <div className="absolute -top-8 -left-16 opacity-60">
        <MosaicFilm />
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
      <MosaicClapperboard />
    </div>

    <h2 className="text-2xl font-bold text-white mb-3">开始你的第一个分镜项目</h2>
    <p className="text-gray-500 text-center max-w-md mb-8">
      上传产品图，让 AI 帮你生成专业的 TVC 广告分镜。<br />
      从创意到可视化，只需几分钟。
    </p>

    <button
      onClick={onNewProject}
      className="px-8 py-4 bg-[#00FF88] hover:bg-[#00DD77] text-black font-semibold rounded-2xl transition-all transform hover:scale-105 flex items-center gap-3 text-lg"
    >
      <Plus size={24} />
      创建新项目
    </button>
  </div>
);

// Project Card Component - v3.20: 删除确认
const ProjectCard = ({
  project,
  onOpen,
  onDelete
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="group bg-[#111111] border border-[#2a2a2a] rounded-3xl overflow-hidden hover:border-[#00FF88]/50 transition-all cursor-pointer"
      onClick={onOpen}
    >
      {/* Cover Image */}
      <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {/* Mosaic placeholder */}
            <div className="opacity-30">
              <MosaicClapperboard />
            </div>
          </div>
        )}

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm ? (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-white text-sm font-medium">确定删除此项目？</p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-white text-sm rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        ) : (
          /* Hover overlay */
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button className="p-3 bg-[#00FF88] rounded-xl text-black hover:bg-[#00DD77] transition-colors">
              <Play size={20} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-3 bg-[#1a1a1a] border border-[#333] rounded-xl text-gray-400 hover:text-red-400 hover:border-red-400/50 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 truncate">{project.name}</h3>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Clock size={14} />
          <span>{formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

// Main Home Component
const Home: React.FC<HomeProps> = ({
  projects,
  onNewProject,
  onOpenProject,
  onDeleteProject
}) => {
  if (projects.length === 0) {
    return (
      <div className="flex-1 bg-[#0a0a0a] p-8">
        <EmptyState onNewProject={onNewProject} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0a0a0a] p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">我的项目</h1>
          <p className="text-gray-500">{projects.length} 个分镜项目</p>
        </div>
        <button
          onClick={onNewProject}
          className="px-6 py-3 bg-[#00FF88] hover:bg-[#00DD77] text-black font-semibold rounded-xl transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          新建项目
        </button>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-20 right-20 opacity-10 pointer-events-none">
        <MosaicCamera />
      </div>
      <div className="fixed bottom-20 right-40 opacity-10 pointer-events-none">
        <MosaicFilm />
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* New Project Card */}
        <div
          onClick={onNewProject}
          className="bg-[#111111] border-2 border-dashed border-[#2a2a2a] rounded-3xl overflow-hidden hover:border-[#00FF88] transition-all cursor-pointer group"
        >
          <div className="aspect-video bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] group-hover:bg-[#00FF88]/10 border border-[#2a2a2a] group-hover:border-[#00FF88]/30 flex items-center justify-center transition-all">
              <Plus size={32} className="text-gray-500 group-hover:text-[#00FF88]" />
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-500 group-hover:text-white transition-colors">新建项目</h3>
          </div>
        </div>

        {/* Project Cards */}
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={() => onOpenProject(project.id)}
            onDelete={() => onDeleteProject(project.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
