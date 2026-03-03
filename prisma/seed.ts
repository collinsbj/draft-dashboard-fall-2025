import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import XLSX from "xlsx";
import {
  IGNORED_QB_COLUMNS,
  QB_COLUMN_MAP,
  normalizeBoolean,
  normalizeInteger,
  normalizeName,
  normalizeString,
} from "../src/lib/columnMaps";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

const QB_SPREADSHEET_PATH =
  process.env.QB_SPREADSHEET_PATH ??
  "/Users/bjcollins/Desktop/Football/Spring 2026 QB Info Sheet.xlsx";

const BOOLEAN_FIELDS = new Set([
  "womens",
  "missingWeeks",
  "socialCaptainInterest",
  "returningMember",
  "ngffl",
  "summitMhcInterest",
]);

const INTEGER_FIELDS = new Set([
  "totalScore",
  "speed",
  "agility",
  "handEyeCoordination",
  "competitiveness",
  "footballExperience",
  "offensiveKnowledge",
  "defensiveKnowledge",
]);

function mapQbRow(
  row: Record<string, unknown>,
  sortOrder: number,
): Prisma.QbCreateManyInput | null {
  const firstName = normalizeName(row["First Name"]);
  const lastName = normalizeName(row["Last Name"]);

  if (!firstName || !lastName) {
    return null;
  }

  const mapped: Record<string, unknown> = {
    firstName,
    lastName,
    sortOrder,
  };

  for (const [rawColumn, rawValue] of Object.entries(row)) {
    if (IGNORED_QB_COLUMNS.has(rawColumn)) continue;
    const mappedKey = QB_COLUMN_MAP[rawColumn];
    if (!mappedKey) continue;

    if (BOOLEAN_FIELDS.has(mappedKey)) {
      mapped[mappedKey] = normalizeBoolean(rawValue) ?? false;
      continue;
    }

    if (INTEGER_FIELDS.has(mappedKey)) {
      mapped[mappedKey] = normalizeInteger(rawValue);
      continue;
    }

    mapped[mappedKey] = normalizeString(rawValue);
  }

  return mapped as Prisma.QbCreateManyInput;
}

function loadQbSeedRows(): Prisma.QbCreateManyInput[] {
  const workbook = XLSX.readFile(QB_SPREADSHEET_PATH);
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
  });

  const mappedRows: Prisma.QbCreateManyInput[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const mapped = mapQbRow(rows[i], i);
    if (mapped) {
      mappedRows.push(mapped);
    }
  }

  return mappedRows;
}

async function main() {
  const qbRows = loadQbSeedRows();

  await prisma.$transaction([
    prisma.qb.deleteMany(),
    prisma.returningPlayer.deleteMany(),
    prisma.rookie.deleteMany(),
  ]);

  if (qbRows.length > 0) {
    await prisma.qb.createMany({
      data: qbRows,
      skipDuplicates: true,
    });
  }

  console.log(
    `Seed complete. QBs inserted: ${qbRows.length}. Returning players inserted: 0. Rookies inserted: 0.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
