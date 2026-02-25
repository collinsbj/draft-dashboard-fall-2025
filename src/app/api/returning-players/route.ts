import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  try {
    const players = await prisma.returningPlayer.findMany({
      orderBy: [
        { bucket: "asc" },
        { group: "asc" },
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });
    return NextResponse.json(players);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch returning players" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows: Prisma.ReturningPlayerCreateInput[] = Array.isArray(body?.rows)
      ? body.rows
      : [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "Request must include a non-empty rows array" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      rows.map((row) =>
        prisma.returningPlayer.upsert({
          where: {
            firstName_lastName: {
              firstName: row.firstName,
              lastName: row.lastName,
            },
          },
          create: row,
          update: row,
        })
      )
    );

    return NextResponse.json({ count: results.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to upsert returning players" },
      { status: 500 }
    );
  }
}
