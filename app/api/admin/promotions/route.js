import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

const include = {
  colors: { select: { id: true, name: true, hex: true } },
  variants: { select: { id: true, quantity: true, isActive: true } },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isOnSale: true },
    orderBy: { createdAt: "desc" },
    include,
  });

  return NextResponse.json(products);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { productId, salePrice } = body;
  const parsed = parseFloat(salePrice);
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 422 });
  }
  if (!salePrice || isNaN(parsed) || parsed <= 0) {
    return NextResponse.json({ error: "salePrice must be a positive number" }, { status: 422 });
  }

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        salePrice: parsed,
        isOnSale: true,
        isOnSale: true,
      },
      include,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("[POST /api/admin/promotions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
