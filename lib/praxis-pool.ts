import type { Address } from "viem";
import { baseSepolia } from "viem/chains";
import { deployment } from "@/config/contracts";

/** Chain where Praxis pool contracts are deployed (matches wagmi config). */
export const praxisChain = baseSepolia;

/** Default initial liquidity per side in human-readable USDC (contract seeds 2× this). */
export const DEFAULT_INITIAL_LIQUIDITY_USDC = 1000;

/** Default CTF for `createPool` when not on `cpfPool` (Envio deployment has no CTF field). */
export function getDefaultCtfContractAddress(): Address {
  return deployment.conditionalTokens;
}
