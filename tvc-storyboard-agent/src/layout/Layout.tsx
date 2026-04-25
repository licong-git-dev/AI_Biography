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
import { useUIStore } from '../stores';

const Layout: React.FC = () => {
  const toggleKeyboardHints = useUIStore((s) => s.toggleKeyboardHints);
  useQuestionMarkKey(toggleKeyboardHints);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <Header />
      <OnboardingBanner />
      <ReleaseReminderBanner />
      <div className="flex min-h-0 flex-1">
        <aside className="scrollbar-thin w-1/4 min-w-[280px] overflow-y-auto border-r border-neutral-800">
          <LeftPanel />
        </aside>
        <main className="flex min-h-0 flex-1 flex-col">
          <CenterPanel />
        </main>
        <aside className="scrollbar-thin w-[30%] min-w-[320px] overflow-y-auto border-l border-neutral-800">
          <RightPanel />
        </aside>
      </div>
      <ApiKeyModal />
      <KeyboardHintsModal />
      <ToastContainer />
    </div>
  );
};

export default Layout;
