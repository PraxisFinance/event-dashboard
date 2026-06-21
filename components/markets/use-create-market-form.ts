import { useCallback, useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import {
  DEFAULT_INITIAL_LIQUIDITY_USDC,
  getDefaultCtfContractAddress,
} from "@/lib/praxis-pool";
import { trpc } from "@/lib/trpc/react";
import { backendFetch } from "@/lib/backend";
import { useBackendAuth } from "@/hooks/use-backend-auth";
import { arrayToInput, inputToArray } from "@/components/markets/market-metadata-fields";
import { useVaultStore } from "@/lib/stores/vault-store";
import type { VaultState } from "@/lib/envio";
import type { Address } from "viem";
import {
  CATEGORIES,
  FIXED_RESOLUTION,
  RESOLUTION_TYPES,
  isMetadataComplete,
  type Category,
  type EventMetadata,
  type ResolutionType,
} from "@/lib/types/event-market";
import { deriveMetadataFromSource } from "@/lib/utils/derive-source-metadata";
import type { CreateMarketEvent } from "./create-market-dialog";

/** Normalise Source expirationTimestamp (may be ms or s) → unix seconds */
export function normaliseTs(ts: number | null | undefined): number | null {
  if (!ts) return null;
  return ts > 1e10 ? Math.floor(ts / 1000) : ts;
}

/** Format a Date to `YYYY-MM-DDTHH:mm` (local time) for datetime-local inputs. */
export function toDatetimeLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Default votingDeadline = expiration - (expiration - now) * 0.1 */
export function defaultVotingDeadline(expirationTs: number): string {
  const nowTs = Math.floor(Date.now() / 1000);
  const deadlineTs = Math.round(expirationTs - (expirationTs - nowTs) * 0.1);
  return toDatetimeLocal(new Date(deadlineTs * 1000));
}

export interface CreateMarketFormState {
  // Form fields
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editCategories: string;
  setEditCategories: (v: string) => void;
  editTags: string;
  setEditTags: (v: string) => void;
  editExpirationInput: string;
  setEditExpirationInput: (v: string) => void;
  editMarketType: string;
  setEditMarketType: (v: string) => void;
  editSlug: string;
  setEditSlug: (v: string) => void;
  votingDeadlineInput: string;
  setVotingDeadlineInput: (v: string) => void;
  initialLiquidityInput: string;
  setInitialLiquidityInput: (v: string) => void;
  // Typed market fields
  editCategory: Category | null;
  setEditCategory: (v: Category | null) => void;
  editResolutionType: ResolutionType | null;
  setEditResolutionType: (v: ResolutionType | null) => void;
  editSideALabel: string;
  setEditSideALabel: (v: string) => void;
  editSideBLabel: string;
  setEditSideBLabel: (v: string) => void;
  editMetadata: EventMetadata;
  patchMetadata: (patch: Partial<EventMetadata>) => void;
  // Derived / computed
  vaultAddress: string;
  conditionId: string | null;
  editedExpirationTs: number | null;
  hasExpiration: boolean;
  hasConditionId: boolean;
  metadataReady: boolean;
  canSubmitOnChain: boolean;
  poolFactory: Address | undefined;
  poolTokenAddress: Address | undefined;
  poolTokenConfigured: boolean;
  poolTokenBlockers: { vaultNotInList: boolean; vaultNeedsIndexerCpfPool: boolean };
  ytAddress: Address | undefined;
  vaultContractAddress: Address | undefined;
  matchedVault: VaultState | undefined;
  // Status
  isLoading: boolean;
  isSuccess: boolean;
  txHash: `0x${string}` | undefined;
  error: string | null;
  // Actions
  handleCreate: () => Promise<void>;
  handleClose: () => void;
}

export function useCreateMarketForm(
  event: CreateMarketEvent | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onPromoted?: (id: string) => void,
): CreateMarketFormState {
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [initialLiquidityInput, setInitialLiquidityInput] = useState(
    String(DEFAULT_INITIAL_LIQUIDITY_USDC),
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategories, setEditCategories] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editExpirationInput, setEditExpirationInput] = useState("");
  const [editMarketType, setEditMarketType] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [votingDeadlineInput, setVotingDeadlineInput] = useState("");

  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editResolutionType, setEditResolutionType] = useState<ResolutionType | null>(null);
  const [editSideALabel, setEditSideALabel] = useState("");
  const [editSideBLabel, setEditSideBLabel] = useState("");
  const [editMetadata, setEditMetadata] = useState<EventMetadata>({});

  const patchMetadata = useCallback((patch: Partial<EventMetadata>) => {
    setEditMetadata((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (!open || !event) return;

    setEditTitle(event.title);
    setEditDescription(event.description ?? "");
    setEditCategories(arrayToInput(event.categories));
    setEditTags(arrayToInput(event.tags));
    setEditMarketType(event.marketType ?? "");
    setEditSlug(event.slug ?? "");

    const expTs = normaliseTs(event.expirationTimestamp);
    if (expTs) {
      setEditExpirationInput(toDatetimeLocal(new Date(expTs * 1000)));
      setVotingDeadlineInput(defaultVotingDeadline(expTs));
    } else {
      setEditExpirationInput("");
      setVotingDeadlineInput("");
    }

    const storedCat = CATEGORIES.includes(event.category as Category)
      ? (event.category as Category)
      : null;
    const storedRt = RESOLUTION_TYPES.includes(event.resolutionType as ResolutionType)
      ? (event.resolutionType as ResolutionType)
      : null;
    const hasStoredMetadata = storedCat !== null;

    if (hasStoredMetadata) {
      const fixedRt = storedCat ? FIXED_RESOLUTION[storedCat] : undefined;
      setEditCategory(storedCat);
      setEditResolutionType(storedRt ?? fixedRt ?? null);
      setEditSideALabel(event.sideALabel ?? "");
      setEditSideBLabel(event.sideBLabel ?? "");
      setEditMetadata((event.metadata as EventMetadata) ?? {});
    } else {
      const derived = deriveMetadataFromSource(event);
      setEditCategory(derived.category);
      setEditResolutionType(derived.resolutionType);
      setEditSideALabel(derived.sideALabel);
      setEditSideBLabel(derived.sideBLabel);
      setEditMetadata(derived.metadata);
    }
  }, [open, event]);

  const utils = trpc.useUtils();
  const { ensureAuthenticated } = useBackendAuth();
  const [vaultsList, setVaultsList] = useState<VaultState[]>([]);
  useEffect(() => {
    backendFetch<VaultState[]>('/vaults').then(setVaultsList).catch(() => {});
  }, []);

  const selectedVault = useVaultStore((s) => s.selectedVault);
  const vaultAddress = selectedVault?.id?.trim() ?? "";

  const [isLoading, setIsLoading] = useState(false);

  const editedExpirationTs = editExpirationInput
    ? Math.floor(new Date(editExpirationInput).getTime() / 1000)
    : null;

  const conditionId = event?.conditionId?.trim() ?? null;

  const {
    matchedVault,
    poolFactory,
    poolTokenAddress,
    ytAddress,
    vaultContractAddress,
    poolTokenBlockers,
  } = useMemo(() => {
    const trimmedVaultId = vaultAddress;
    const matched =
      trimmedVaultId && vaultsList?.length
        ? vaultsList.find((v) => v.id.toLowerCase() === trimmedVaultId.toLowerCase())
        : undefined;

    let factory: Address | undefined;
    let token: Address | undefined;
    let ytAddr: Address | undefined;
    let vaultAddr: Address | undefined;

    if (trimmedVaultId) {
      const cp = matched?.cpfPool;
      const rawFactory = cp?.id?.trim();
      if (rawFactory && isAddress(rawFactory)) factory = rawFactory as Address;
      token = getDefaultCtfContractAddress();
      if (matched) {
        if (isAddress(matched.yt)) ytAddr = matched.yt as Address;
        if (isAddress(matched.id)) vaultAddr = matched.id as Address;
      }
    }

    const vaultNotInList = Boolean(trimmedVaultId && vaultsList && !matched);
    const vaultNeedsIndexerCpfPool = Boolean(
      trimmedVaultId && matched && (!factory || !token || !ytAddr),
    );

    return {
      matchedVault: matched,
      poolFactory: factory,
      poolTokenAddress: token,
      ytAddress: ytAddr,
      vaultContractAddress: vaultAddr,
      poolTokenBlockers: { vaultNotInList, vaultNeedsIndexerCpfPool },
    };
  }, [vaultAddress, vaultsList]);

  const poolTokenConfigured = Boolean(poolTokenAddress) && !poolTokenBlockers.vaultNotInList;
  const hasConditionId = Boolean(conditionId);
  const hasExpiration = Boolean(editedExpirationTs && !Number.isNaN(editedExpirationTs));

  const metadataReady = isMetadataComplete(
    editCategory,
    editResolutionType,
    editSideALabel,
    editSideBLabel,
    editMetadata,
  );

  const canSubmitOnChain = Boolean(
    poolFactory &&
      poolTokenConfigured &&
      !poolTokenBlockers.vaultNeedsIndexerCpfPool &&
      ytAddress &&
      vaultContractAddress &&
      hasConditionId &&
      hasExpiration &&
      metadataReady,
  );

  const handleCreate = async () => {
    if (!event) return;
    setError(null);

    try {
      if (!poolFactory) {
        if (vaultAddress) {
          if (!matchedVault)
            throw new Error(
              "Unknown vault: it is not in the indexer list. Select an indexed vault on the Vaults page.",
            );
          throw new Error(
            "This vault has no indexer CPF match (need CPFDeploymentInfo where stakingToken is the vault YT), or the CPF address is invalid. Refresh after Envio sync.",
          );
        }
        throw new Error(
          "Missing pool factory. Set NEXT_PUBLIC_PRAXIS_POOL_FACTORY_ADDRESS or select an active vault on the Vaults page (indexed with CPFDeploymentInfo for that vault's YT).",
        );
      }
      if (!conditionId)
        throw new Error("Missing conditionId. It must come from the Source market.");
      if (!editedExpirationTs || Number.isNaN(editedExpirationTs))
        throw new Error("Set a valid expiration date before deploying.");
      if (!votingDeadlineInput) throw new Error("Voting deadline is required.");
      if (!vaultContractAddress)
        throw new Error("No vault contract address available. Select an indexed vault.");
      if (!editCategory) throw new Error("Category is required.");
      if (!editResolutionType) throw new Error("Resolution type is required.");
      if (!editSideALabel.trim() || !editSideBLabel.trim())
        throw new Error("Side A and Side B labels are required.");
      if (!metadataReady)
        throw new Error("Fill all required fields for the selected category before deploying.");

      const votingDeadlineTs = Math.floor(new Date(votingDeadlineInput).getTime() / 1000);
      if (Number.isNaN(votingDeadlineTs)) throw new Error("Invalid voting deadline.");
      if (votingDeadlineTs > editedExpirationTs)
        throw new Error("Voting deadline must be on or before the expiration.");

      const parsedLiquidity = parseInt(initialLiquidityInput, 10);
      if (!parsedLiquidity || Number.isNaN(parsedLiquidity) || parsedLiquidity <= 0)
        throw new Error("Initial liquidity must be a positive number.");

      await ensureAuthenticated();
      setIsLoading(true);

      const result = await backendFetch<{ contractTxHash: string; contractEventId: string }>(
        '/events/deploy-market',
        {
          method: 'POST',
          body: JSON.stringify({
            eventId: event.id,
            eventSource: event.source as "praxis" | "source",
            sourceId: event.source === "source" ? event.id : null,
            conditionId,
            logo: event.logo ?? null,
            vaultAddress: vaultContractAddress,
            poolFactoryAddress: poolFactory,
            expirationTs: editedExpirationTs,
            votingDeadlineTs,
            initialLiquidityUsdc: parsedLiquidity,
            title: editTitle,
            description: editDescription || null,
            categories: inputToArray(editCategories),
            tags: inputToArray(editTags),
            marketType: editMarketType || null,
            slug: editSlug || null,
            category: editCategory,
            resolutionType: editResolutionType,
            sideALabel: editSideALabel,
            sideBLabel: editSideBLabel,
            metadata: editMetadata,
            cpfAddress: poolFactory,
            vault: vaultAddress || null,
          }),
        },
      );

      setTxHash(result.contractTxHash as `0x${string}`);
      setIsSuccess(true);
      void utils.events.list.invalidate();
      onPromoted?.(event.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setError(null);
      setTxHash(undefined);
      setIsSuccess(false);
      setVotingDeadlineInput("");
    }, 300);
  };

  return {
    editTitle, setEditTitle,
    editDescription, setEditDescription,
    editCategories, setEditCategories,
    editTags, setEditTags,
    editExpirationInput, setEditExpirationInput,
    editMarketType, setEditMarketType,
    editSlug, setEditSlug,
    votingDeadlineInput, setVotingDeadlineInput,
    initialLiquidityInput, setInitialLiquidityInput,
    editCategory, setEditCategory,
    editResolutionType, setEditResolutionType,
    editSideALabel, setEditSideALabel,
    editSideBLabel, setEditSideBLabel,
    editMetadata, patchMetadata,
    vaultAddress,
    conditionId,
    editedExpirationTs,
    hasExpiration,
    hasConditionId,
    metadataReady,
    canSubmitOnChain,
    poolFactory,
    poolTokenAddress,
    poolTokenConfigured,
    poolTokenBlockers,
    ytAddress,
    vaultContractAddress,
    matchedVault,
    isLoading,
    isSuccess,
    txHash,
    error,
    handleCreate,
    handleClose,
  };
}
