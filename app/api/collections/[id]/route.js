import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(_req, { params }) {
  const { id } = await params;
  const collection = await prisma.collection.findFirst({
    where: { id, status: "in_store" },
    include: {
      products: {
        include: {
          colors: { select: { id: true, name: true, hex: true } },
          variants: {
            select: {
              id: true,
              size: true,
              colorName: true,
              colorHex: true,
              quantity: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json(collection);
}
