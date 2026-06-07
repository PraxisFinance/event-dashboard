/** Envio `PraxisRegistry_VaultCPFPairDeployed`; `id` aliases `cpf` (pool factory). */
export interface PraxisRegistryPairInfo {
  id: string;
  vault: string;
  cpf: string;
  pt: string;
  yt: string;
  usdc: string;
  morphoVault: string;
  stakingToken: string;
  treasury: string;
  maturity: string;
  startTime: string;
  endTime: string;
}

export interface VaultState {
  id: string;
  maturity: string;
  pt: string;
  yt: string;
  totalDeposited: string;
  totalWithdrawn: string;
  totalBalance: string;
  totalBuyInCost: string;
  totalYieldPaid: string;
  uniqueDepositors: number;
  isPaused: boolean;
  owner: string;
  lastUpdatedAt: string;
  deployedAt: string;
  /** Merged from `PraxisRegistry_VaultCPFPairDeployed` where `vault === id`. */
  cpfPool: PraxisRegistryPairInfo | null;
}

export interface UserPosition {
  id: string;
  vault_id: string;
  address: string;
  totalDeposited: string;
  totalWithdrawn: string;
  currentBalance: string;
  totalBuyInCost: string;
  totalYieldClaimed: string;
  depositCount: number;
  firstDepositAt: string;
  lastActivityAt: string;
}

export interface VaultDailySnapshot {
  id: string;
  vault_id: string;
  date: string;
  timestamp: string;
  totalBalance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  totalYieldPaid: string;
  uniqueDepositors: number;
  dailyDeposits: string;
  dailyWithdrawals: string;
  dailyYield: string;
}

const ALL_VAULTS_QUERY = `
  query AllVaults {
    VaultState {
      id
      maturity
      pt
      yt
      totalDeposited
      totalWithdrawn
      totalBalance
      totalBuyInCost
      totalYieldPaid
      uniqueDepositors
      isPaused
      owner
      lastUpdatedAt
      deployedAt
    }
    PraxisRegistry_VaultCPFPairDeployed {
      vault
      cpf
      pt
      yt
      usdc
      morphoVault
      stakingToken
      treasury
      maturity
      startTime
      endTime
    }
  }
`;

function normAddr(addr: string): string {
  return String(addr).trim().toLowerCase();
}

type RawPairDeployed = Omit<PraxisRegistryPairInfo, "id">;

function toPairInfo(row: RawPairDeployed): PraxisRegistryPairInfo {
  return {
    ...row,
    id: row.cpf,
  };
}

function mergeVaultCpfDeployment(
  vaults: Omit<VaultState, "cpfPool">[],
  pairs: RawPairDeployed[],
): VaultState[] {
  const byVault = new Map<string, PraxisRegistryPairInfo>();
  for (const row of pairs) {
    byVault.set(normAddr(row.vault), toPairInfo(row));
  }

  return vaults.map((v) => {
    const pair = byVault.get(normAddr(v.id));
    if (!pair) return { ...v, cpfPool: null };
    return { ...v, cpfPool: pair };
  });
}

export async function fetchAllVaults(
  indexerUrl: string,
): Promise<VaultState[]> {
  const res = await fetch(indexerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: ALL_VAULTS_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`Envio indexer error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as {
    data?: {
      VaultState?: Omit<VaultState, "cpfPool">[];
      PraxisRegistry_VaultCPFPairDeployed?: RawPairDeployed[];
    };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  const vaultRows = json.data?.VaultState ?? [];
  const pairRows = json.data?.PraxisRegistry_VaultCPFPairDeployed ?? [];
  return mergeVaultCpfDeployment(vaultRows, pairRows);
}
