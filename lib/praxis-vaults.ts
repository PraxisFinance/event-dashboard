import type { Address } from "viem";
import { isAddress } from "viem";

function parseAddress(raw: string | undefined): Address | undefined {
  const s = (raw ?? "").trim();
  if (!s || !isAddress(s)) return undefined;
  return s;
}

// Each getter uses a literal property path so Next.js/Webpack can inline
// the NEXT_PUBLIC_ value at build time (dynamic bracket access won't work).

export function getVaultUsdcAddress(): Address | undefined {
  return parseAddress(process.env.NEXT_PUBLIC_VAULT_USDC_ADDRESS);
}

export function getVaultMorphoVaultAddress(): Address | undefined {
  return parseAddress(process.env.NEXT_PUBLIC_VAULT_MORPHO_VAULT_ADDRESS);
}

export function getVaultTreasuryAddress(): Address | undefined {
  return parseAddress(process.env.NEXT_PUBLIC_CPF_TREASURY_ADDRESS);
}
