import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Provider, ID } from "@/types";

interface ProviderState {
  providers: Provider[];
  activeProviderId: ID | null;
  selectedProviderId: ID | null;
  setActiveProvider: (id: ID) => void;
  selectProvider: (id: ID | null) => void;
  setProviders: (providers: Provider[]) => void;
  upsertProvider: (provider: Provider) => void;
  removeProvider: (id: ID) => void;
  getActiveProvider: () => Provider | undefined;
}

const initialProviders: Provider[] = [];

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      providers: initialProviders,
      activeProviderId: null,
      selectedProviderId: null,

      setActiveProvider: (id) => set({ activeProviderId: id }),
      selectProvider: (id) => set({ selectedProviderId: id }),
      setProviders: (providers) => set({ providers }),

      upsertProvider: (provider) => {
        const existing = get().providers;
        const idx = existing.findIndex((p) => p.id === provider.id);
        if (idx >= 0) {
          const next = [...existing];
          next[idx] = provider;
          set({ providers: next });
        } else {
          set({ providers: [...existing, provider] });
        }
      },

      removeProvider: (id) => {
        set({ providers: get().providers.filter((p) => p.id !== id) });
      },

      getActiveProvider: () => {
        const state = get();
        return state.providers.find((p) => p.id === state.activeProviderId);
      },
    }),
    {
      name: "moataz-providers",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as unknown as Storage))),
      partialize: (state) => ({
        activeProviderId: state.activeProviderId,
        selectedProviderId: state.selectedProviderId,
      }),
    }
  )
);
