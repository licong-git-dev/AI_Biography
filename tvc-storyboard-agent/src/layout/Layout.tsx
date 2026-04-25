import React from 'react';
import Header from './Header';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import ApiKeyModal from '../components/ApiKeyModal';
import OnboardingBanner from '../components/OnboardingBanner';
import ReleaseReminderBanner from '../components/ReleaseReminderBanner';
import ToastContainer from '../components/ToastContainer';
import KeyboardHintsModal from '../components/KeyboardHintsModal';
import { useQuestionMarkKey } from '../components/useQuestionMarkKey';
import { useGlobalSearchHotkey } from '../components/useGlobalSearchHotkey';
import GlobalSearchModal from '../components/GlobalSearchModal';
import { useUIStore } from '../stores';

const Layout: React.FC = () => {
  const toggleKeyboardHints = useUIStore((s) => s.toggleKeyboardHints);
  const openGlobalSearch = useUIStore((s) => s.openGlobalSearch);
  const closeGlobalSearch = useUIStore((s) => s.closeGlobalSearch);
  const globalSearchOpen = useUIStore((s) => s.globalSearchOpen);
  useQuestionMarkKey(toggleKeyboardHints);
  useGlobalSearchHotkey(openGlobalSearch);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-900 text-ink-100">
      <Header />
      <OnboardingBanner />
      <ReleaseReminderBanner />
      <div className="flex min-h-0 flex-1">
        <aside className="scrollbar-thin w-1/4 min-w-[280px] overflow-y-auto border-r border-ink-800/80 bg-ink-900/60">
          <LeftPanel />
        </aside>
        <main className="flex min-h-0 flex-1 flex-col bg-ink-900/40">
          <CenterPanel />
        </main>
        <aside className="scrollbar-thin w-[30%] min-w-[320px] overflow-y-auto border-l border-ink-800/80 bg-ink-900/60">
          <RightPanel />
        </aside>
      </div>
      <ApiKeyModal />
      <KeyboardHintsModal />
      <GlobalSearchModal
        open={globalSearchOpen}
        onClose={closeGlobalSearch}
      />
      <ToastContainer />
    </div>
  );
};

export default Layout;
