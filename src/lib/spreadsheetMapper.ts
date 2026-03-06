import * as XLSX from "xlsx";
import {
  IGNORED_QB_COLUMNS,
  RETURNING_AND_ROOKIE_COLUMN_MAP,
  QB_COLUMN_MAP,
  UploadTableType,
  normalizeBoolean,
  normalizeInteger,
  normalizeName,
  normalizeString,
} from "@/lib/columnMaps";

const QB_BOOLEAN_FIELDS = new Set([
  "womens",
  "missingWeeks",
  "socialCaptainInterest",
  "returningMember",
  "ngffl",
  "summitMhcInterest",
]);

const RETURNING_BOOLEAN_FIELDS = new Set([
  "womens",
  "missingWeeks",
  "socialCaptainInterest",
  "ngffl",
]);

const INTEGER_FIELDS = new Set([
  "group",
  "totalScore",
  "speed",
  "agility",
  "handEyeCoordination",
  "competitiveness",
  "footballExperience",
  "offensiveKnowledge",
  "defensiveKnowledge",
]);

type ParsedSpreadsheetRow = Record<string, string | number | boolean | null>;

export type ParsedPlayersResult = {
  returningPlayers: ParsedSpreadsheetRow[];
  rookies: ParsedSpreadsheetRow[];
};

function mapRawValue(
  key: string,
  rawValue: unknown,
  isQb: boolean,
): string | number | boolean | null {
  const booleanFields = isQb ? QB_BOOLEAN_FIELDS : RETURNING_BOOLEAN_FIELDS;

  if (booleanFields.has(key)) {
    return normalizeBoolean(rawValue) ?? false;
  }

  if (INTEGER_FIELDS.has(key)) {
    return normalizeInteger(rawValue);
  }

  return normalizeString(rawValue);
}

function findSheetBySubstring(
  sheetNames: string[],
  substring: string,
): string | undefined {
  const lower = substring.toLowerCase();
  return sheetNames.find((name) => name.toLowerCase().includes(lower));
}

function parsePlayerRows(
  sheet: XLSX.WorkSheet,
): ParsedSpreadsheetRow[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const parsedRows: ParsedSpreadsheetRow[] = [];

  rows.forEach((row) => {
    const firstName = normalizeName(row["First Name"]);
    const lastName = normalizeName(row["Last Name"]);
    if (!firstName || !lastName) return;

    const parsed: ParsedSpreadsheetRow = { firstName, lastName };

    Object.entries(row).forEach(([spreadsheetKey, rawValue]) => {
      const mappedKey = RETURNING_AND_ROOKIE_COLUMN_MAP[spreadsheetKey];
      if (!mappedKey || mappedKey === "firstName" || mappedKey === "lastName")
        return;
      parsed[mappedKey] = mapRawValue(mappedKey, rawValue, false);
    });

    parsedRows.push(parsed);
  });

  return parsedRows;
}

export function parseSpreadsheet(
  fileBuffer: Uint8Array,
  tableType: UploadTableType,
): ParsedSpreadsheetRow[] | ParsedPlayersResult {
  const workbook = XLSX.read(fileBuffer, { type: "array" });

  if (tableType === "players") {
    const returnerSheet = findSheetBySubstring(
      workbook.SheetNames,
      "Returner",
    );
    const rookieSheet = findSheetBySubstring(workbook.SheetNames, "Rookie");

    return {
      returningPlayers: returnerSheet
        ? parsePlayerRows(workbook.Sheets[returnerSheet])
        : [],
      rookies: rookieSheet
        ? parsePlayerRows(workbook.Sheets[rookieSheet])
        : [],
    };
  }

  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[firstSheet],
    { defval: null },
  );

  const parsedRows: ParsedSpreadsheetRow[] = [];

  rows.forEach((row) => {
    const fullName = normalizeName(row["Full Name"]);
    if (!fullName) return;

    const parsed: ParsedSpreadsheetRow = { fullName };

    Object.entries(row).forEach(([spreadsheetKey, rawValue]) => {
      if (IGNORED_QB_COLUMNS.has(spreadsheetKey)) return;
      const mappedKey = QB_COLUMN_MAP[spreadsheetKey];
      if (!mappedKey || mappedKey === "fullName") return;
      parsed[mappedKey] = mapRawValue(mappedKey, rawValue, true);
    });

    parsedRows.push(parsed);
  });

  return parsedRows;
}
