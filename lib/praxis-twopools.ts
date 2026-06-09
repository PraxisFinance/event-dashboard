import type { Address } from "viem";
import { isAddress } from "viem";

function parseAddress(raw: string | undefined): Address | undefined {
  const s = (raw ?? "").trim();
  if (!s || !isAddress(s)) return undefined;
  return s;
}

/** Default curve address (can be overridden per-deployment in the form). */
export function getTwoPoolDefaultCurveAddress(): Address | undefined {
  return parseAddress(process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_CURVE);
}

/** Default treasury address for fee collection. */
export function getTwoPoolDefaultTreasury(): Address | undefined {
  return parseAddress(process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_TREASURY);
}

/**
 * Default alpha as a raw uint256 string.
 * Controls the settlement curve shape.
 */
export function getTwoPoolDefaultAlpha(): string {
  return (process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_ALPHA ?? "500000000000000000").trim() || "500000000000000000";
}

/**
 * Default fee percentage as a raw uint256 string (out of 10,000).
 * e.g. "100" = 1%.
 */
export function getTwoPoolDefaultFeePercentage(): string {
  return (process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_FEE_BPS ?? "100").trim() || "100";
}

/**
 * Default initial seed liquidity per side as a raw uint256 string (YT wei).
 * Pool receives 2× this amount total.
 */
export function getTwoPoolDefaultSeedAmount(): string {
  return (
    process.env.NEXT_PUBLIC_TWO_POOL_DEFAULT_SEED_AMOUNT ?? "1000000000000000000000"
  ).trim() || "1000000000000000000000";
}
