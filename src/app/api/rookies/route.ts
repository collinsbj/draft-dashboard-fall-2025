import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  try {
    const players = await prisma.rookie.findMany({
      orderBy: [
        { bucket: "asc" },
        { group: "asc" },
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });
    return NextResponse.json(players);
  } catch {
    return NextResponse.json({ error: "Failed to fetch rookies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows: Prisma.RookieCreateInput[] = Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "Request must include a non-empty rows array" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      rows.map((row) =>
        prisma.rookie.upsert({
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
    return NextResponse.json({ error: "Failed to upsert rookies" }, { status: 500 });
  }
}
