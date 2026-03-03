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

function mapRawValue(
  key: string,
  rawValue: unknown,
  tableType: UploadTableType,
): string | number | boolean | null {
  const booleanFields =
    tableType === "qbs" ? QB_BOOLEAN_FIELDS : RETURNING_BOOLEAN_FIELDS;

  if (booleanFields.has(key)) {
    return normalizeBoolean(rawValue) ?? false;
  }

  if (INTEGER_FIELDS.has(key)) {
    return normalizeInteger(rawValue);
  }

  return normalizeString(rawValue);
}

export function parseSpreadsheet(
  fileBuffer: Uint8Array,
  tableType: UploadTableType,
): ParsedSpreadsheetRow[] {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[firstSheet],
    { defval: null },
  );

  const columnMap =
    tableType === "qbs" ? QB_COLUMN_MAP : RETURNING_AND_ROOKIE_COLUMN_MAP;

  const parsedRows: ParsedSpreadsheetRow[] = [];

  rows.forEach((row) => {
    if (tableType === "qbs") {
      const fullName = normalizeName(row["Full Name"]);
      if (!fullName) return;

      const parsed: ParsedSpreadsheetRow = { fullName };

      Object.entries(row).forEach(([spreadsheetKey, rawValue]) => {
        if (IGNORED_QB_COLUMNS.has(spreadsheetKey)) return;
        const mappedKey = columnMap[spreadsheetKey];
        if (!mappedKey || mappedKey === "fullName") return;
        parsed[mappedKey] = mapRawValue(mappedKey, rawValue, tableType);
      });

      parsedRows.push(parsed);
    } else {
      const firstName = normalizeName(row["First Name"]);
      const lastName = normalizeName(row["Last Name"]);
      if (!firstName || !lastName) return;

      const parsed: ParsedSpreadsheetRow = { firstName, lastName };

      Object.entries(row).forEach(([spreadsheetKey, rawValue]) => {
        const mappedKey = columnMap[spreadsheetKey];
        if (!mappedKey || mappedKey === "firstName" || mappedKey === "lastName")
          return;
        parsed[mappedKey] = mapRawValue(mappedKey, rawValue, tableType);
      });

      parsedRows.push(parsed);
    }
  });

  return parsedRows;
}
