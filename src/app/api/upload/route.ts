import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { UploadTableType, makeNameKey } from "@/lib/columnMaps";
import { parseSpreadsheet } from "@/lib/spreadsheetMapper";
import { Prisma } from "@/generated/prisma/client";

function isUploadTableType(value: unknown): value is UploadTableType {
  return value === "qbs" || value === "returningPlayers" || value === "rookies";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function pickAllowedFields(
  row: Record<string, unknown>,
  allowedFields: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(
      ([key, value]) => allowedFields.includes(key) && value !== undefined,
    ),
  );
}

const QB_UPLOAD_FIELDS = [
  "fullName",
  "height",
  "pronouns",
  "womens",
  "totalScore",
  "speed",
  "agility",
  "handEyeCoordination",
  "competitiveness",
  "footballExperience",
  "offensiveKnowledge",
  "defensiveKnowledge",
  "qb",
  "blocker",
  "wr",
  "slot",
  "rusher",
  "safety",
  "corner",
  "linebacker",
  "missingWeeks",
  "whichWeeks",
  "additionalContext",
  "otherExperience",
  "offDefCaptainExperience",
  "offDefCaptainInterest",
  "socialCaptainInterest",
  "returningMember",
  "ngffl",
  "summitMhcInterest",
] as const;

const RETURNING_AND_ROOKIE_UPLOAD_FIELDS = [
  "firstName",
  "lastName",
  "bucket",
  "group",
  "height",
  "jerseySize",
  "pronouns",
  "womens",
  "offDefCaptainExperience",
  "offDefCaptainInterest",
  "socialCaptainInterest",
  "ngffl",
  "speed",
  "agility",
  "handEyeCoordination",
  "competitiveness",
  "footballExperience",
  "offensiveKnowledge",
  "defensiveKnowledge",
  "totalScore",
  "qb",
  "blocker",
  "wr",
  "slot",
  "rusher",
  "safety",
  "corner",
  "linebacker",
  "missingWeeks",
  "whichWeeks",
  "additionalContext",
  "otherExperience",
] as const;

function sanitizeQbPayload(
  row: Record<string, unknown>,
): Prisma.QbUncheckedCreateInput {
  return pickAllowedFields(
    row,
    QB_UPLOAD_FIELDS,
  ) as Prisma.QbUncheckedCreateInput;
}

function sanitizeReturningPayload(
  row: Record<string, unknown>,
): Prisma.ReturningPlayerUncheckedCreateInput {
  return pickAllowedFields(
    row,
    RETURNING_AND_ROOKIE_UPLOAD_FIELDS,
  ) as Prisma.ReturningPlayerUncheckedCreateInput;
}

function sanitizeRookiePayload(
  row: Record<string, unknown>,
): Prisma.RookieUncheckedCreateInput {
  return pickAllowedFields(
    row,
    RETURNING_AND_ROOKIE_UPLOAD_FIELDS,
  ) as Prisma.RookieUncheckedCreateInput;
}

async function syncQbs(rows: Record<string, unknown>[]) {
  const existing = await prisma.qb.findMany();
  const incomingKeys = new Set<string>();

  await prisma.$transaction(
    rows.map((row) => {
      const fullName = String(row.fullName ?? "").trim();
      const key = fullName.toLowerCase();
      incomingKeys.add(key);

      const payload = sanitizeQbPayload(row);

      return prisma.qb.upsert({
        where: { fullName },
        create: { ...payload, fullName },
        update: payload,
      });
    }),
  );

  const removedIds = existing
    .filter((row) => !incomingKeys.has(row.fullName.trim().toLowerCase()))
    .map((row) => row.id);

  if (removedIds.length) {
    await prisma.qb.deleteMany({ where: { id: { in: removedIds } } });
  }

  return { removed: removedIds.length };
}

async function syncReturningPlayers(rows: Record<string, unknown>[]) {
  const existing = await prisma.returningPlayer.findMany();
  const incomingKeys = new Set<string>();

  await prisma.$transaction(
    rows.map((row) => {
      const firstName = String(row.firstName ?? "");
      const lastName = String(row.lastName ?? "");
      const key = makeNameKey(firstName, lastName);
      incomingKeys.add(key);
      const payload = sanitizeReturningPayload(row);

      return prisma.returningPlayer.upsert({
        where: { firstName_lastName: { firstName, lastName } },
        create: { ...payload, firstName, lastName },
        update: payload,
      });
    }),
  );

  const removedIds = existing
    .filter(
      (row) => !incomingKeys.has(makeNameKey(row.firstName, row.lastName)),
    )
    .map((row) => row.id);

  if (removedIds.length) {
    await prisma.returningPlayer.deleteMany({
      where: { id: { in: removedIds } },
    });
  }

  return { removed: removedIds.length };
}

async function syncRookies(rows: Record<string, unknown>[]) {
  const existing = await prisma.rookie.findMany();
  const incomingKeys = new Set<string>();

  await prisma.$transaction(
    rows.map((row) => {
      const firstName = String(row.firstName ?? "");
      const lastName = String(row.lastName ?? "");
      const key = makeNameKey(firstName, lastName);
      incomingKeys.add(key);
      const payload = sanitizeRookiePayload(row);

      return prisma.rookie.upsert({
        where: { firstName_lastName: { firstName, lastName } },
        create: { ...payload, firstName, lastName },
        update: payload,
      });
    }),
  );

  const removedIds = existing
    .filter(
      (row) => !incomingKeys.has(makeNameKey(row.firstName, row.lastName)),
    )
    .map((row) => row.id);

  if (removedIds.length) {
    await prisma.rookie.deleteMany({ where: { id: { in: removedIds } } });
  }

  return { removed: removedIds.length };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tableType = formData.get("tableType");
    const file = formData.get("file");

    if (!isUploadTableType(tableType)) {
      return NextResponse.json(
        { error: "tableType must be one of qbs, returningPlayers, rookies" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing upload file" },
        { status: 400 },
      );
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    let rows: Record<string, unknown>[];
    try {
      rows = parseSpreadsheet(fileBytes, tableType);
    } catch (error) {
      console.error("Spreadsheet parse failed", error);
      return NextResponse.json(
        { error: `Failed to parse spreadsheet: ${getErrorMessage(error)}` },
        { status: 400 },
      );
    }

    if (!rows.length) {
      return NextResponse.json(
        { error: "No valid rows found in uploaded spreadsheet" },
        { status: 400 },
      );
    }

    if (tableType === "qbs") {
      try {
        const before = await prisma.qb.count();
        const syncResult = await syncQbs(rows);
        const after = await prisma.qb.count();
        return NextResponse.json({
          tableType,
          addedOrUpdated: rows.length,
          removed: syncResult.removed,
          totalRows: after,
          previousTotalRows: before,
        });
      } catch (error) {
        console.error("QB upload sync failed", error);
        return NextResponse.json(
          { error: `Failed to sync QB rows: ${getErrorMessage(error)}` },
          { status: 500 },
        );
      }
    }

    if (tableType === "returningPlayers") {
      try {
        const before = await prisma.returningPlayer.count();
        const syncResult = await syncReturningPlayers(rows);
        const after = await prisma.returningPlayer.count();
        return NextResponse.json({
          tableType,
          addedOrUpdated: rows.length,
          removed: syncResult.removed,
          totalRows: after,
          previousTotalRows: before,
        });
      } catch (error) {
        console.error("Returning players upload sync failed", error);
        return NextResponse.json(
          {
            error: `Failed to sync returning player rows: ${getErrorMessage(error)}`,
          },
          { status: 500 },
        );
      }
    }

    try {
      const before = await prisma.rookie.count();
      const syncResult = await syncRookies(rows);
      const after = await prisma.rookie.count();
      return NextResponse.json({
        tableType,
        addedOrUpdated: rows.length,
        removed: syncResult.removed,
        totalRows: after,
        previousTotalRows: before,
      });
    } catch (error) {
      console.error("Rookies upload sync failed", error);
      return NextResponse.json(
        { error: `Failed to sync rookie rows: ${getErrorMessage(error)}` },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Upload request failed", error);
    return NextResponse.json(
      {
        error: `Failed to process spreadsheet upload: ${getErrorMessage(error)}`,
      },
      { status: 500 },
    );
  }
}
