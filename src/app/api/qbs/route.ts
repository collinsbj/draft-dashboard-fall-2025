import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  try {
    const qbs = await prisma.qb.findMany({
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json(qbs);
  } catch {
    return NextResponse.json({ error: "Failed to fetch QBs" }, { status: 500 });
  }
}
