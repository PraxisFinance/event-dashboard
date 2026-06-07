import type { Address } from "viem";
import { isAddress } from "viem";
import { baseSepolia } from "viem/chains";

/** Chain where Praxis pool contracts are deployed (matches wagmi config). */
export const praxisChain = baseSepolia;

/** Default initial liquidity per side in human-readable USDC (contract seeds 2× this). */
export const DEFAULT_INITIAL_LIQUIDITY_USDC = 1000;

/** Default CTF for `createPool` / mock setup when not on `cpfPool` (Envio deployment has no CTF field). */
export function getDefaultCtfContractAddress(): Address | undefined {
  const raw = process.env.NEXT_PUBLIC_CTF_CONTRACT_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return undefined;
  return raw as Address;
}
