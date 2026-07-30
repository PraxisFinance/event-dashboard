export const CATEGORIES = [
  "crypto",
  "esports",
  "sport",
  "politics",
  "tech",
  "finance",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const RESOLUTION_TYPES = [
  "up_down",
  "above_below",
  "price_range",
  "hit",
  "winner",
  "yes_no",
] as const;
export type ResolutionType = (typeof RESOLUTION_TYPES)[number];

export const RESOLUTION_TYPE_LABELS: Record<ResolutionType, string> = {
  up_down: "Up / Down",
  above_below: "Above / Below",
  price_range: "Price Range",
  hit: "Hit Target",
  winner: "Winner",
  yes_no: "Yes / No",
};

/** Which resolution types are allowed per category. */
export const CATEGORY_RESOLUTION_MAP: Record<Category, ResolutionType[]> = {
  crypto: ["up_down", "above_below", "price_range", "hit"],
  esports: ["winner"],
  sport: ["winner"],
  politics: ["yes_no"],
  tech: ["yes_no"],
  finance: ["yes_no"],
};

/** Categories whose resolution type is fixed — no user selection needed. */
export const FIXED_RESOLUTION: Partial<Record<Category, ResolutionType>> = {
  esports: "winner",
  sport: "winner",
  politics: "yes_no",
  tech: "yes_no",
  finance: "yes_no",
};

export const ESPORT_GAME_OPTIONS = [
  { value: "dota2", label: "Dota 2" },
  { value: "csgo", label: "CS:GO" },
  { value: "lol", label: "League of Legends" },
  { value: "valorant", label: "Valorant" },
  { value: "cod", label: "Call of Duty" },
] as const;
export type EsportGameId = (typeof ESPORT_GAME_OPTIONS)[number]["value"];

export const SPORT_DISCIPLINE_OPTIONS = [
  { value: "football", label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "hockey", label: "Hockey" },
  { value: "formula1", label: "Formula 1" },
  { value: "tennis", label: "Tennis" },
] as const;
export type SportDisciplineId = (typeof SPORT_DISCIPLINE_OPTIONS)[number]["value"];

/** Flat metadata shape stored as a single JSONB column.
 *  Only the fields relevant to the selected category + resolution type are populated.
 */
export interface EventMetadata {
  // ── crypto ──────────────────────────────────────────────
  assetSymbol?: string;
  resolutionAssetLabel?: string;
  resolutionReferenceDateLabel?: string;
  // ── finance ─────────────────────────────────────────────
  assetName?: string;
  assetTicker?: string;
  resolutionSourceLabel?: string;
  // ── esports ─────────────────────────────────────────────
  gameId?: EsportGameId;
  teamAName?: string;
  teamALogoUrl?: string;
  teamBName?: string;
  teamBLogoUrl?: string;
  streamUrl?: string;
  // ── sport ────────────────────────────────────────────────
  disciplineId?: SportDisciplineId;
  resolutionDeadlineLabel?: string;
  // ── politics / tech ──────────────────────────────────────
  resolutionParagraphs?: string[];
  // ── above_below ──────────────────────────────────────────
  strikes?: { targetLabel: string }[];
  // ── price_range ──────────────────────────────────────────
  lowerBoundLabel?: string;
  upperBoundLabel?: string;
  // ── hit ──────────────────────────────────────────────────
  targetPriceLabel?: string;
}

/** Returns true when all required fields for the given category + resolution are filled. */
export function isMetadataComplete(
  category: Category | null,
  resolutionType: ResolutionType | null,
  sideALabel: string,
  sideBLabel: string,
  metadata: EventMetadata,
): boolean {
  if (!category || !resolutionType || !sideALabel.trim() || !sideBLabel.trim())
    return false;

  switch (category) {
    case "crypto":
      if (
        !metadata.assetSymbol?.trim() ||
        !metadata.resolutionAssetLabel?.trim() ||
        !metadata.resolutionReferenceDateLabel?.trim()
      )
        return false;
      break;
    case "finance":
      if (
        !metadata.assetName?.trim() ||
        !metadata.assetTicker?.trim() ||
        !metadata.resolutionAssetLabel?.trim() ||
        !metadata.resolutionSourceLabel?.trim() ||
        !metadata.resolutionReferenceDateLabel?.trim()
      )
        return false;
      break;
    case "esports":
      if (
        !metadata.gameId ||
        !metadata.teamAName?.trim() ||
        !metadata.teamALogoUrl?.trim() ||
        !metadata.teamBName?.trim() ||
        !metadata.teamBLogoUrl?.trim()
      )
        return false;
      break;
    case "sport":
      if (
        !metadata.disciplineId ||
        !metadata.teamAName?.trim() ||
        !metadata.teamALogoUrl?.trim() ||
        !metadata.teamBName?.trim() ||
        !metadata.teamBLogoUrl?.trim() ||
        !metadata.resolutionDeadlineLabel?.trim()
      )
        return false;
      break;
    case "politics":
    case "tech":
      if (
        !metadata.resolutionParagraphs?.length ||
        !metadata.resolutionParagraphs.some((p) => p.trim())
      )
        return false;
      break;
  }

  switch (resolutionType) {
    case "above_below":
      if (
        !metadata.strikes ||
        metadata.strikes.filter((s) => s.targetLabel.trim()).length < 2
      )
        return false;
      break;
    case "price_range":
      if (!metadata.lowerBoundLabel?.trim() || !metadata.upperBoundLabel?.trim())
        return false;
      break;
    case "hit":
      if (!metadata.targetPriceLabel?.trim()) return false;
      break;
  }

  return true;
}

/** Maps a Limitless/Source esportTitle slug to our gameId enum. */
export function mapEsportTitle(title: string): EsportGameId | undefined {
  const map: Record<string, EsportGameId> = {
    "dota-2": "dota2",
    dota2: "dota2",
    "cs-go": "csgo",
    csgo: "csgo",
    "counter-strike": "csgo",
    "league-of-legends": "lol",
    lol: "lol",
    valorant: "valorant",
    "call-of-duty": "cod",
    cod: "cod",
  };
  return map[title.toLowerCase()];
}

/** Infers our category from a Source event's categories string array. */
export function inferCategory(cats?: string[]): Category | null {
  if (!cats?.length) return null;
  const lower = cats.map((c) => c.toLowerCase());
  if (lower.some((c) => c === "esports" || c === "esport")) return "esports";
  if (lower.some((c) => c === "sports" || c === "sport")) return "sport";
  if (lower.some((c) => c === "crypto" || c === "cryptocurrency")) return "crypto";
  if (lower.some((c) => c === "finance" || c === "financial")) return "finance";
  if (lower.some((c) => c === "politics" || c === "political")) return "politics";
  if (lower.some((c) => c === "tech" || c === "technology")) return "tech";
  return null;
}
