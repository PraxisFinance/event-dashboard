"use client";

import { useEffect } from "react";
import { backendFetch } from "@/lib/backend";
import { useVaultStore } from "@/lib/stores/vault-store";
import type { VaultState } from "@/lib/envio";

/**
 * Runs once per session inside the provider tree.
 * If no vault is persisted (or the persisted one is no longer indexed),
 * auto-selects the most-recently-updated vault from the backend.
 */
export function VaultInitializer() {
  const { selectedVault, setSelectedVault } = useVaultStore();

  useEffect(() => {
    backendFetch<VaultState[]>('/api/vaults')
      .then((vaults) => {
        if (!vaults || vaults.length === 0) return;

        const stillExists = selectedVault
          ? vaults.some((v) => v.id === selectedVault.id)
          : false;

        if (stillExists) return;

        const newest = vaults.reduce((a, b) =>
          Number(a.deployedAt) >= Number(b.deployedAt) ? a : b,
        );

        setSelectedVault({
          id: newest.id,
          pt: newest.pt,
          yt: newest.yt,
          maturity: newest.maturity,
          isPaused: newest.isPaused,
          owner: newest.owner,
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
