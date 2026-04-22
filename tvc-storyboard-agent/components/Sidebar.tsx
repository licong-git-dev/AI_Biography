import React from 'react';
import { Home, Clapperboard, Settings, Users } from 'lucide-react';

type ViewType = 'home' | 'project' | 'models';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onSettingsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onSettingsClick
}) => {
  return (
    <div className="w-16 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col items-center py-4 z-30">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-[#00FF88] flex items-center justify-center mb-6">
        <span className="text-black font-bold text-xl">F</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            currentView === 'home'
              ? 'bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88]'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-white'
          }`}
          title="首页"
        >
          <Home size={20} />
        </button>

        {/* Current Project */}
        <button
          onClick={() => onNavigate('project')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            currentView === 'project'
              ? 'bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88]'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-white'
          }`}
          title="当前项目"
        >
          <Clapperboard size={20} />
        </button>

        {/* Model Library */}
        <button
          onClick={() => onNavigate('models')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            currentView === 'models'
              ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-white'
          }`}
          title="模特库"
        >
          <Users size={20} />
        </button>
      </nav>

      {/* Settings */}
      <button
        onClick={onSettingsClick}
        className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:bg-[#252525] hover:text-white transition-colors"
        title="设置"
      >
        <Settings size={20} />
      </button>
    </div>
  );
};

export default Sidebar;
