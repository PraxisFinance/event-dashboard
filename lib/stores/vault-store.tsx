"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SelectedVault {
  id: string; // contract address
  pt: string;
  yt: string;
  maturity: string; // BigInt as string
  isPaused: boolean;
  owner: string;
}

interface VaultState {
  selectedVault: SelectedVault | null;
  setSelectedVault: (v: SelectedVault | null) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      selectedVault: null,
      setSelectedVault: (v) => set({ selectedVault: v }),
    }),
    { name: "praxis:selected-vault" },
  ),
);
