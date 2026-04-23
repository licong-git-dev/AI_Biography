import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hasApiKey as checkKey } from '../services/apiKey';

export type CenterTab = 'episodes' | 'chapters' | 'shots';

interface UIStore {
  centerTab: CenterTab;
  setCenterTab: (tab: CenterTab) => void;

  apiKeyModalOpen: boolean;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;

  apiKeyPresent: boolean;
  refreshApiKey: () => void;

  onboardingDismissed: boolean;
  dismissOnboarding: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      centerTab: 'episodes',
      setCenterTab: (centerTab) => set({ centerTab }),

      apiKeyModalOpen: false,
      openApiKeyModal: () => set({ apiKeyModalOpen: true }),
      closeApiKeyModal: () => set({ apiKeyModalOpen: false }),

      apiKeyPresent: checkKey(),
      refreshApiKey: () => set({ apiKeyPresent: checkKey() }),

      onboardingDismissed: false,
      dismissOnboarding: () => set({ onboardingDismissed: true }),
    }),
    {
      name: 'licong-ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        onboardingDismissed: state.onboardingDismissed,
      }),
    }
  )
);
