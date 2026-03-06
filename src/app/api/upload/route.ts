import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { UploadTableType } from "@/lib/columnMaps";
import { parseSpreadsheet, ParsedPlayersResult } from "@/lib/spreadsheetMapper";
import { Prisma } from "@/generated/prisma/client";

function isUploadTableType(value: unknown): value is UploadTableType {
  return value === "qbs" || value === "players";
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

const RETURNING_PLAYER_UPLOAD_FIELDS = [
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

const ROOKIE_UPLOAD_FIELDS = [
  ...RETURNING_PLAYER_UPLOAD_FIELDS,
  "dateOfBirth",
  "mobileNumber",
  "accountEmail",
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
    RETURNING_PLAYER_UPLOAD_FIELDS,
  ) as Prisma.ReturningPlayerUncheckedCreateInput;
}

function sanitizeRookiePayload(
  row: Record<string, unknown>,
): Prisma.RookieUncheckedCreateInput {
  return pickAllowedFields(
    row,
    ROOKIE_UPLOAD_FIELDS,
  ) as Prisma.RookieUncheckedCreateInput;
}

async function syncQbs(rows: Record<string, unknown>[]) {
  await prisma.qb.deleteMany();
  await prisma.qb.createMany({ data: rows.map(sanitizeQbPayload) });
}

async function syncReturningPlayers(rows: Record<string, unknown>[]) {
  await prisma.returningPlayer.deleteMany();
  await prisma.returningPlayer.createMany({
    data: rows.map(sanitizeReturningPayload),
  });
}

async function syncRookies(rows: Record<string, unknown>[]) {
  await prisma.rookie.deleteMany();
  await prisma.rookie.createMany({ data: rows.map(sanitizeRookiePayload) });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tableType = formData.get("tableType");
    const file = formData.get("file");

    if (!isUploadTableType(tableType)) {
      return NextResponse.json(
        { error: "tableType must be one of qbs, players" },
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
    let parsed: ReturnType<typeof parseSpreadsheet>;
    try {
      parsed = parseSpreadsheet(fileBytes, tableType);
    } catch (error) {
      console.error("Spreadsheet parse failed", error);
      return NextResponse.json(
        { error: `Failed to parse spreadsheet: ${getErrorMessage(error)}` },
        { status: 400 },
      );
    }

    if (tableType === "qbs") {
      const rows = parsed as Record<string, unknown>[];
      if (!rows.length) {
        return NextResponse.json(
          { error: "No valid rows found in uploaded spreadsheet" },
          { status: 400 },
        );
      }
      try {
        await syncQbs(rows);
        return NextResponse.json({
          tableType,
          addedOrUpdated: rows.length,
        });
      } catch (error) {
        console.error("QB upload sync failed", error);
        return NextResponse.json(
          { error: `Failed to sync QB rows: ${getErrorMessage(error)}` },
          { status: 500 },
        );
      }
    }

    const { returningPlayers, rookies } = parsed as ParsedPlayersResult;
    if (!returningPlayers.length && !rookies.length) {
      return NextResponse.json(
        { error: "No valid rows found in uploaded spreadsheet" },
        { status: 400 },
      );
    }

    try {
      if (returningPlayers.length) await syncReturningPlayers(returningPlayers);
      if (rookies.length) await syncRookies(rookies);
      return NextResponse.json({
        tableType,
        returning: { addedOrUpdated: returningPlayers.length },
        rookies: { addedOrUpdated: rookies.length },
      });
    } catch (error) {
      console.error("Players upload sync failed", error);
      return NextResponse.json(
        { error: `Failed to sync player rows: ${getErrorMessage(error)}` },
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
