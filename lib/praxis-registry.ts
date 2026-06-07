import type { Address } from "viem";
import { isAddress } from "viem";

function parseAddress(raw: string | undefined): Address | undefined {
  const s = (raw ?? "").trim();
  if (!s || !isAddress(s)) return undefined;
  return s;
}

export function getPraxisRegistryAddress(): Address | undefined {
  return parseAddress(process.env.NEXT_PUBLIC_PRAXIS_REGISTRY_ADDRESS);
}
