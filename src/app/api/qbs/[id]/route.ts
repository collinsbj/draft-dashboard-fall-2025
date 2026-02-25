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
    const qbId = Number(id);
    if (!Number.isFinite(qbId)) {
      return NextResponse.json({ error: "Invalid QB id" }, { status: 400 });
    }

    const { data } = (await request.json()) as { data: Prisma.QbUpdateInput };
    const updated = await prisma.qb.update({
      where: { id: qbId },
      data,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update QB" }, { status: 500 });
  }
}
