import type { Address } from "viem";
import { deployment } from "@/config/contracts";

export function getPraxisRegistryAddress(): Address {
  return deployment.praxisRegistry;
}
