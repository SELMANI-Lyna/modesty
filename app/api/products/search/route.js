import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category");

  if (q) {
    await prisma.searchLog.create({ data: { query: q } });
  }

  const where = {};
  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }
  if (category) {
    where.category = category;
  }

  const products = await prisma.product.findMany({
    where,
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
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const active = products.filter((product) =>
    product.variants.some((v) => v.isActive)
  );

  return NextResponse.json(active);
}
