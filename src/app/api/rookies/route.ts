import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

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
