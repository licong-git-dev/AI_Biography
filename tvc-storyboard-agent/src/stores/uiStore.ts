import { create } from 'zustand';
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
}

export const useUIStore = create<UIStore>((set) => ({
  centerTab: 'episodes',
  setCenterTab: (centerTab) => set({ centerTab }),

  apiKeyModalOpen: false,
  openApiKeyModal: () => set({ apiKeyModalOpen: true }),
  closeApiKeyModal: () => set({ apiKeyModalOpen: false }),

  apiKeyPresent: checkKey(),
  refreshApiKey: () => set({ apiKeyPresent: checkKey() }),
}));
