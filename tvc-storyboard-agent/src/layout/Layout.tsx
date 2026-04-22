import React from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      <aside className="w-1/4 min-w-[280px] border-r border-neutral-800 overflow-y-auto">
        <LeftPanel />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <CenterPanel />
      </main>
      <aside className="w-[30%] min-w-[320px] border-l border-neutral-800 overflow-y-auto">
        <RightPanel />
      </aside>
    </div>
  );
};

export default Layout;
