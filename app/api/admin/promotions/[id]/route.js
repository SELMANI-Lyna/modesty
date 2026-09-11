import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

const include = {
  colors: { select: { id: true, name: true, hex: true } },
  variants: { select: { id: true, quantity: true, isActive: true } },
};

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = {};
  if (body.salePrice !== undefined) {
    const parsed = parseFloat(body.salePrice);
    if (isNaN(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "salePrice must be a positive number" }, { status: 422 });
    }
    data.salePrice = parsed;
  }
  if (body.isOnSale !== undefined) {
    data.isOnSale = !!body.isOnSale;
    data.isOnSale = !!body.isOnSale;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include,
    });
    return NextResponse.json(product);
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("[PUT /api/admin/promotions/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
