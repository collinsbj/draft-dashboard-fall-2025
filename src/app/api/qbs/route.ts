import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  try {
    const qbs = await prisma.qb.findMany({
      orderBy: [{ sortOrder: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
    });
    return NextResponse.json(qbs);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch QBs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows: Prisma.QbCreateInput[] = Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "Request must include a non-empty rows array" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      rows.map((row, index) =>
        prisma.qb.upsert({
          where: {
            firstName_lastName: {
              firstName: row.firstName,
              lastName: row.lastName,
            },
          },
          create: {
            ...row,
            sortOrder: row.sortOrder ?? index,
          },
          update: row,
        })
      )
    );

    return NextResponse.json({ count: results.length });
  } catch {
    return NextResponse.json({ error: "Failed to upsert QBs" }, { status: 500 });
  }
}
