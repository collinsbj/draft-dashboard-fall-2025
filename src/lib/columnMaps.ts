export type UploadTableType = "qbs" | "returningPlayers" | "rookies";

export type SpreadsheetColumnMap = Record<string, string>;

export const IGNORED_QB_COLUMNS = new Set([
  "Category",
  "Interest in outreach and volunteer opportunities?",
  "Want to Ref",
  "Interest in sponsoring a player?",
]);

const SHARED_COLUMN_ALIASES: SpreadsheetColumnMap = {
  Height: "height",
  "Preferred Pronouns": "pronouns",
  "Womens+?": "womens",
  "Total Score": "totalScore",
  Speed: "speed",
  Agility: "agility",
  "Hand-Eye Coordination": "handEyeCoordination",
  Competitiveness: "competitiveness",
  "Football Experience": "footballExperience",
  "Offensive Knowledge": "offensiveKnowledge",
  "Defensive Knowledge": "defensiveKnowledge",
  "Q.B.": "qb",
  "Blocker/Center": "blocker",
  "W.R.": "wr",
  Slot: "slot",
  Rusher: "rusher",
  Safety: "safety",
  Corner: "corner",
  Linebacker: "linebacker",
  "Missing Weeks?": "missingWeeks",
  "Which weeks?": "whichWeeks",
  "Additional Context": "additionalContext",
  "Other Experience": "otherExperience",
  "Experience with Off/Def Captain?": "offDefCaptainExperience",
  "Interest in being an Off/Def Captain?": "offDefCaptainInterest",
  "Social Captain": "socialCaptainInterest",
  "NGFFL within 2 years?": "ngffl",
};

export const QB_COLUMN_MAP: SpreadsheetColumnMap = {
  ...SHARED_COLUMN_ALIASES,
  "Full Name": "fullName",
  "Returning DGLFFL Member?": "returningMember",
  "Summit/MHC Interest?": "summitMhcInterest",
};

export const RETURNING_AND_ROOKIE_COLUMN_MAP: SpreadsheetColumnMap = {
  ...SHARED_COLUMN_ALIASES,
  "First Name": "firstName",
  "Last Name": "lastName",
  "Jersey Size": "jerseySize",
  Bucket: "bucket",
  Group: "group",
};

export const UPLOAD_COLUMN_MAPS: Record<UploadTableType, SpreadsheetColumnMap> =
  {
    qbs: QB_COLUMN_MAP,
    returningPlayers: RETURNING_AND_ROOKIE_COLUMN_MAP,
    rookies: RETURNING_AND_ROOKIE_COLUMN_MAP,
  };

const TRUE_VALUES = new Set(["yes", "true", "y", "1"]);
const FALSE_VALUES = new Set(["no", "false", "n", "0"]);

export function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value == null) return null;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return null;
}

export function normalizeInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (value == null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function normalizeString(value: unknown): string | null {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export function normalizeName(value: unknown): string {
  return normalizeString(value) ?? "";
}

export function makeNameKey(firstName: string, lastName: string): string {
  return `${firstName.trim().toLowerCase()}::${lastName.trim().toLowerCase()}`;
}
