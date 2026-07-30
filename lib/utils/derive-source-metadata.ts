/**
 * Derives typed market metadata from a Limitless/Source event.
 *
 * Detection priority:
 *   1. esportTitle  → esports winner
 *   2. sportType    → sport winner (group) or sport with just discipline (single prop)
 *   3. type:"ladder" + CRYPTO oracle → crypto above_below
 *   4. "Up or Down" in title + oracle → finance/crypto up_down
 *   5. "above $X" in title + oracle  → crypto hit
 *   6. Fallback     → inferCategory from categories array
 *
 * Post-processing:
 *   • politics/tech → resolutionParagraphs auto-populated from event.description
 */

import {
  FIXED_RESOLUTION,
  inferCategory,
  mapEsportTitle,
  type Category,
  type EventMetadata,
  type ResolutionType,
  type SportDisciplineId,
} from "@/lib/types/event-market";
import type { CreateMarketEvent } from "@/components/markets/create-market-dialog";

export interface DerivedMarketMetadata {
  category: Category | null;
  resolutionType: ResolutionType | null;
  sideALabel: string;
  sideBLabel: string;
  metadata: EventMetadata;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Strips oracle namespace prefix from a Pyth symbol for display.
 *  "Crypto.BTC/USD" → "BTC/USD"
 *  "Equity.US.GME/USD" → "GME/USD"
 */
function pythSymbolDisplay(symbol: string): string {
  return symbol.replace(/^[A-Za-z]+(\.[A-Z]{2})?\./, "");
}

function buildResolutionAssetLabel(ticker: string, symbol?: string): string {
  if (!symbol) return ticker;
  return `${ticker} (Pyth ${pythSymbolDisplay(symbol)})`;
}

function buildResolutionSourceLabel(symbol?: string): string {
  if (!symbol) return "Pyth price feed";
  return `Pyth ${pythSymbolDisplay(symbol)} price feed`;
}

/** Parses the first dollar amount from a sub-market title like "above $63359.09". */
function parseStrikeLabel(title: string): string | null {
  const m = title.match(/\$([0-9]+(?:[.,][0-9]+)*)/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(num)) return null;
  const str = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).replace(/\.?0+$/, "");
  return `$${str}`;
}

function formatPrice(raw: string | number): string {
  const num = typeof raw === "number" ? raw : parseFloat(raw);
  if (Number.isNaN(num)) return String(raw);
  const str = num
    .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })
    .replace(/\.?0+$/, "");
  return `$${str}`;
}

/**
 * Splits an event description (plain text or HTML) into paragraphs for
 * use as resolutionParagraphs. Strips HTML tags and empty lines.
 */
function descriptionToParagraphs(description: string): string[] {
  let text = description;
  if (/<[a-z]/i.test(text)) {
    text = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<[^>]+>/g, "");
    // Decode common HTML entities
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
  }
  return text
    .split(/\n{2,}/)
    .map((s) => s.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

/** Maps Limitless sportType values to our disciplineId enum. */
const SPORT_TYPE_MAP: Partial<Record<string, SportDisciplineId>> = {
  football: "football",
  soccer: "football",
  basketball: "basketball",
  hockey: "hockey",
  "ice-hockey": "hockey",
  ice_hockey: "hockey",
  formula1: "formula1",
  "formula-1": "formula1",
  formula_1: "formula1",
  f1: "formula1",
  tennis: "tennis",
};

// ── Pattern detectors ──────────────────────────────────────────────────────────

/** Pattern 1: esports match winner (group with esportTitle in metadata) or
 *  esports single prop (map winner etc., with videogameSlug in metadata).
 */
function deriveEsports(event: CreateMarketEvent): DerivedMarketMetadata | null {
  const meta = event.sourceMetadata;
  // Groups carry `esportTitle`; single esports props carry `videogameSlug`.
  const esportSlug = (meta?.esportTitle ?? meta?.videogameSlug) as
    | string
    | undefined;
  if (!esportSlug) return null;

  const mA = event.markets?.[0];
  const mB = event.markets?.[1];
  const teamAName = mA?.title ?? (meta?.homeTeam as string | undefined) ?? "";
  const teamBName = mB?.title ?? (meta?.awayTeam as string | undefined) ?? "";
  const teamALogoUrl = mA?.logo ?? mA?.imageUrl ?? "";
  const teamBLogoUrl = mB?.logo ?? mB?.imageUrl ?? "";
  const gameId = mapEsportTitle(esportSlug);

  return {
    category: "esports",
    resolutionType: "winner",
    sideALabel: teamAName,
    sideBLabel: teamBName,
    metadata: { gameId, teamAName, teamALogoUrl, teamBName, teamBLogoUrl },
  };
}

/** Pattern 2: sport match winner (group or single with sportType in metadata).
 *
 *  Football groups have 3 sub-markets (Home / Away / Draw). We filter out the
 *  "Draw" market and take the first two as teamA / teamB.
 *  Singles carry team/player names in metadata (homeTeam/awayTeam, plus
 *  player1Name/player2Name for tennis). Moneyline singles resolve to a team,
 *  so sides mirror the team names; other props (total goals, corners, etc.)
 *  resolve Yes/No. Logos are not available on singles and stay manual.
 */
function deriveSport(event: CreateMarketEvent): DerivedMarketMetadata | null {
  const meta = event.sourceMetadata;
  const sportType = meta?.sportType as string | undefined;
  if (!sportType) return null;

  const disciplineId = SPORT_TYPE_MAP[sportType.toLowerCase()];
  const expirationDate = event.expirationDate ?? "";

  // Group match winner
  if (event.markets && event.markets.length >= 2) {
    const teamMarkets = event.markets.filter(
      (m) => m.title.toLowerCase() !== "draw",
    );
    const mA = teamMarkets[0];
    const mB = teamMarkets[1];
    const teamAName = mA?.title ?? (meta?.homeTeam as string | undefined) ?? "";
    const teamBName = mB?.title ?? (meta?.awayTeam as string | undefined) ?? "";
    const teamALogoUrl = mA?.logo ?? mA?.imageUrl ?? "";
    const teamBLogoUrl = mB?.logo ?? mB?.imageUrl ?? "";

    return {
      category: "sport",
      resolutionType: "winner",
      sideALabel: teamAName,
      sideBLabel: teamBName,
      metadata: {
        disciplineId,
        teamAName,
        teamALogoUrl,
        teamBName,
        teamBLogoUrl,
        resolutionDeadlineLabel: expirationDate,
      },
    };
  }

  // Single sport market — team/player names come from metadata
  const teamAName =
    ((meta?.player1Name ?? meta?.homeTeam) as string | undefined) ?? "";
  const teamBName =
    ((meta?.player2Name ?? meta?.awayTeam) as string | undefined) ?? "";
  const isMoneyline = meta?.binaryMarketType === "moneyline";

  return {
    category: "sport",
    resolutionType: "winner",
    sideALabel: isMoneyline ? teamAName : "Yes",
    sideBLabel: isMoneyline ? teamBName : "No",
    metadata: {
      disciplineId,
      teamAName,
      teamBName,
      resolutionDeadlineLabel: expirationDate,
    },
  };
}

/** Pattern 3: crypto above/below strikes (group with type:"ladder" + CRYPTO oracle). */
function deriveCryptoLadder(event: CreateMarketEvent): DerivedMarketMetadata | null {
  if (event.sourceMetadata?.type !== "ladder") return null;
  if (!event.markets?.length) return null;

  const oracle = event.markets[0].priceOracleMetadata;
  if (!oracle) return null;
  const assetType = oracle.assetType ?? "";
  if (!assetType.toUpperCase().includes("CRYPTO")) return null;

  const ticker = oracle.ticker ?? "";
  const strikes = event.markets
    .map((m) => parseStrikeLabel(m.title))
    .filter((s): s is string => s !== null)
    .map((targetLabel) => ({ targetLabel }));

  return {
    category: "crypto",
    resolutionType: "above_below",
    sideALabel: "Above",
    sideBLabel: "Below",
    metadata: {
      assetSymbol: ticker,
      resolutionAssetLabel: buildResolutionAssetLabel(ticker, oracle.symbol),
      resolutionReferenceDateLabel: event.expirationDate ?? "",
      strikes: strikes.length >= 2 ? strikes : undefined,
    },
  };
}

/** Pattern 4: finance or crypto up/down (single, "Up or Down" in title, oracle present). */
function deriveUpDown(event: CreateMarketEvent): DerivedMarketMetadata | null {
  if (!/up or down/i.test(event.title)) return null;

  // priceOracleMetadata can live directly on the event (single market from source page)
  const oracle = event.priceOracleMetadata;
  if (!oracle?.ticker) return null;

  const ticker = oracle.ticker;
  const name = oracle.name ?? ticker;
  const isEquity = (oracle.assetType ?? "").toUpperCase().includes("EQUITY");
  const category: Category = isEquity ? "finance" : "crypto";
  const shared: EventMetadata = {
    resolutionAssetLabel: buildResolutionAssetLabel(isEquity ? name : ticker, oracle.symbol),
    resolutionReferenceDateLabel: event.expirationDate ?? "",
  };

  if (category === "finance") {
    return {
      category,
      resolutionType: "up_down",
      sideALabel: "Up",
      sideBLabel: "Down",
      metadata: {
        ...shared,
        assetName: name,
        assetTicker: ticker,
        resolutionSourceLabel: buildResolutionSourceLabel(oracle.symbol),
      },
    };
  }

  return {
    category: "crypto",
    resolutionType: "up_down",
    sideALabel: "Up",
    sideBLabel: "Down",
    metadata: { ...shared, assetSymbol: ticker },
  };
}

/** Pattern 5: crypto hit — single market, "above $X" title, oracle present. */
function derivePriceHit(event: CreateMarketEvent): DerivedMarketMetadata | null {
  if (!/above\s+\$[\d,\.]+/i.test(event.title)) return null;
  const oracle = event.priceOracleMetadata;
  if (!oracle?.ticker) return null;

  const rawPrice = event.sourceMetadata?.openPrice as string | undefined;
  const targetPriceLabel = rawPrice
    ? formatPrice(rawPrice)
    : (parseStrikeLabel(event.title) ?? "");

  return {
    category: "crypto",
    resolutionType: "hit",
    sideALabel: "Yes",
    sideBLabel: "No",
    metadata: {
      assetSymbol: oracle.ticker,
      targetPriceLabel,
      resolutionAssetLabel: buildResolutionAssetLabel(oracle.ticker, oracle.symbol),
      resolutionReferenceDateLabel: event.expirationDate ?? "",
    },
  };
}

/** Pattern 6: fallback — infer category from categories array; leave metadata empty. */
function deriveFallback(event: CreateMarketEvent): DerivedMarketMetadata {
  const category = inferCategory(event.categories);
  const resolutionType: ResolutionType | null = category
    ? (FIXED_RESOLUTION[category] ?? null)
    : null;
  return { category, resolutionType, sideALabel: "", sideBLabel: "", metadata: {} };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Derives the best-guess category, resolution type, side labels, and metadata
 * from a Limitless/Source event.
 *
 * Returns null/empty fields where derivation is not possible — those remain
 * for the admin to fill manually.
 */
export function deriveMetadataFromSource(event: CreateMarketEvent): DerivedMarketMetadata {
  const result =
    deriveEsports(event) ??
    deriveSport(event) ??
    deriveCryptoLadder(event) ??
    deriveUpDown(event) ??
    derivePriceHit(event) ??
    deriveFallback(event);

  // Post-processing: for politics/tech, populate resolutionParagraphs from
  // the event description (which is the canonical resolution text).
  if (
    (result.category === "politics" || result.category === "tech") &&
    !result.metadata.resolutionParagraphs?.length &&
    event.description
  ) {
    result.metadata.resolutionParagraphs = descriptionToParagraphs(event.description);
  }

  return result;
}
