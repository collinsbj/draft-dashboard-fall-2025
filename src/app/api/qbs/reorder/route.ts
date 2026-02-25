import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

type ReorderItem = {
  id: number;
  sortOrder: number;
};

export async function PUT(request: Request) {
  try {
    const { updates } = (await request.json()) as { updates: ReorderItem[] };
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
    }

    await prisma.$transaction(
      updates.map((item) =>
        prisma.qb.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reorder QBs" }, { status: 500 });
  }
}
