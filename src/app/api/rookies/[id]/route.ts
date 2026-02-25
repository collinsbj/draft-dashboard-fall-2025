import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const playerId = Number(id);
    if (!Number.isFinite(playerId)) {
      return NextResponse.json({ error: "Invalid player id" }, { status: 400 });
    }

    const { data } = (await request.json()) as {
      data: Prisma.RookieUpdateInput;
    };

    const updated = await prisma.rookie.update({
      where: { id: playerId },
      data,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update rookie" }, { status: 500 });
  }
}
