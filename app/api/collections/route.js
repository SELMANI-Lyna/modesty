import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  const collections = await prisma.collection.findMany({
    where: { status: "in_store" },
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        select: { id: true, name: true, images: true },
      },
    },
  });
  return NextResponse.json(collections);
}
