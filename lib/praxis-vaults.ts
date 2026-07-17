import type { Address } from "viem";
import { deployment } from "@/config/contracts";

// Each function returns a hardcoded address from the shared deployment config.

export function getVaultUsdcAddress(): Address {
  return deployment.usdc;
}

export function getVaultMorphoVaultAddress(): Address {
  return deployment.morphoVault;
}

export function getVaultTreasuryAddress(): Address {
  return deployment.protocolTreasury;
}
