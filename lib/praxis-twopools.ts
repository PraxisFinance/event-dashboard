import type { Address } from "viem";
import { isAddress } from "viem";
import { deployment } from "@/config/contracts";

function parseAddress(raw: string | undefined): Address | undefined {
  const s = (raw ?? "").trim();
  if (!s || !isAddress(s)) return undefined;
  return s;
}

/** Default curve address (can be overridden per-deployment in the form). */
export function getTwoPoolDefaultCurveAddress(): Address {
  return deployment.twoPoolRegistry;
}

/** Default treasury address for fee collection. Falls back to protocolTreasury. */
export function getTwoPoolDefaultTreasury(): Address {
  return parseAddress(process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_TREASURY) ?? deployment.protocolTreasury;
}

/**
 * Default buffer (φ/phi) as a raw uint256 string.
 * Controls the settlement curve shape.
 */
export function getTwoPoolDefaultBuffer(): string {
  return (
    process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_BUFFER ??
    process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_ALPHA ??
    "500000000000000000"
  ).trim() || "500000000000000000";
}

/**
 * Default fee percentage as a raw uint256 string (out of 10,000).
 * e.g. "100" = 1%.
 */
export function getTwoPoolDefaultFeePercentage(): string {
  return (process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_FEE_BPS ?? "100").trim() || "100";
}

/**
 * Default initial seed liquidity as a raw uint256 string (YT base units, 6 decimals).
 * 1000000000 = 1000 YT. Matches backend getTwoPoolDefaultSeedAmount().
 */
export function getTwoPoolDefaultSeedAmount(): string {
  return (
    process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_SEED_AMOUNT ?? "1000000000"
  ).trim() || "1000000000";
}
