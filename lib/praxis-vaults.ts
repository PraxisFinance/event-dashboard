import type { Address } from "viem";
import { deployment } from "@/config/contracts";

// Each function returns a hardcoded address from the shared deployment config.

export function getVaultUsdcAddress(): Address {
  return deployment.mockUSDC;
}

export function getVaultMorphoVaultAddress(): Address {
  return deployment.mockMorphoVault;
}

export function getVaultTreasuryAddress(): Address {
  return deployment.protocolTreasury;
}
