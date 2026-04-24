import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface EpisodeAlert {
  id: string;
  triggeredByEpisodeId: string; // 哪个集的改动触发的
  affectedEpisodeId: string;    // 哪个集受到影响
  severity: AlertSeverity;
  message: string;
  createdAt: number;
  acknowledged?: boolean;
}

interface AlertsStore {
  alerts: EpisodeAlert[];
  add: (a: Omit<EpisodeAlert, 'id' | 'createdAt' | 'acknowledged'>) => void;
  addMany: (list: Omit<EpisodeAlert, 'id' | 'createdAt' | 'acknowledged'>[]) => void;
  acknowledge: (id: string) => void;
  acknowledgeAll: (episodeId: string) => void;
  remove: (id: string) => void;
  clearByTrigger: (triggerEpisodeId: string) => void;
  clearByEpisode: (episodeId: string) => void;
  byEpisode: (episodeId: string) => EpisodeAlert[];
}

export const useAlertsStore = create<AlertsStore>()(
  persist(
    (set, get) => ({
      alerts: [],

      add: (a) =>
        set((s) => ({
          alerts: [
            ...s.alerts,
            {
              ...a,
              id: `al-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: Date.now(),
            },
          ],
        })),

      addMany: (list) =>
        set((s) => {
          const newOnes = list.map((a) => ({
            ...a,
            id: `al-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            createdAt: Date.now(),
          }));
          return { alerts: [...s.alerts, ...newOnes] };
        }),

      acknowledge: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.id === id ? { ...a, acknowledged: true } : a
          ),
        })),

      acknowledgeAll: (episodeId) =>
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.affectedEpisodeId === episodeId ? { ...a, acknowledged: true } : a
          ),
        })),

      remove: (id) =>
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

      clearByTrigger: (triggerEpisodeId) =>
        set((s) => ({
          alerts: s.alerts.filter(
            (a) => a.triggeredByEpisodeId !== triggerEpisodeId
          ),
        })),

      clearByEpisode: (episodeId) =>
        set((s) => ({
          alerts: s.alerts.filter(
            (a) =>
              a.affectedEpisodeId !== episodeId &&
              a.triggeredByEpisodeId !== episodeId
          ),
        })),

      byEpisode: (episodeId) =>
        get().alerts.filter(
          (a) => a.affectedEpisodeId === episodeId && !a.acknowledged
        ),
    }),
    {
      name: 'licong-alerts',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ alerts: state.alerts }),
    }
  )
);
