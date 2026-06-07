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
