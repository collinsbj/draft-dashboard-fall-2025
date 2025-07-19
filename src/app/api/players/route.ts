import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { Prisma } from "@/generated/prisma";

export async function GET(request: Request) {
  // If request has query param of returning=true, filter players
  const url = new URL(request.url);
  const rookie = url.searchParams.get("rookie");
  const selected = url.searchParams.get("selected");

  const options: Prisma.PlayerFindManyArgs = {
    orderBy: [
      {
        bucket: "asc",
      },
      {
        group: "asc",
      },
      {
        firstName: "asc",
      },
      {
        lastName: "asc",
      },
    ],
  };

  if (rookie) {
    options.where = {
      rookie: rookie === "true" ? true : false,
    };

    if (rookie === "true") {
      options.orderBy = [
        {
          totalScore: "desc",
        },
        {
          firstName: "asc",
        },
        {
          lastName: "asc",
        },
      ];
    }
  }

  if (selected) {
    options.where = {
      ...options.where,
      selected: selected === "true" ? true : false,
    };
    options.orderBy = [
      {
        firstName: "asc",
      },
    ];
  }

  try {
    const players = await prisma.player.findMany(options);
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, data } = await request.json();
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedPlayer);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}
