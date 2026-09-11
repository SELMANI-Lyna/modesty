import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

const CATEGORIES = ["JUPE", "ENSEMBLE", "ROBE", "HIJAB", "PANTALON", "VESTE"];

function normalizeCategory(category) {
  const raw = String(category || "").trim().toUpperCase();
  return CATEGORIES.includes(raw) ? raw : "JUPE";
}

function validateProductBody(body) {
  const errors = {};
  const { name, price, variants = [] } = body;

  if (!name?.trim()) errors.name = "Name is required.";

  const parsedPrice = parseFloat(price);
  if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.price = "Price must be a positive number.";
  }

  const parsedSalePrice = body.salePrice ? parseFloat(body.salePrice) : null;
  if (body.salePrice && (isNaN(parsedSalePrice) || parsedSalePrice <= 0)) {
    errors.salePrice = "Sale price must be a positive number.";
  }

  variants.forEach((v, i) => {
    const qty = Number(v.quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      errors[`variant_${i}_quantity`] = `Row "${v.size}-${v.colorName}": quantity must be a non-negative whole number.`;
    }
    if (v.price && (isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0)) {
      errors[`variant_${i}_price`] = `Row "${v.size}-${v.colorName}": price override must be positive.`;
    }
  });

  return errors;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      colors: { select: { id: true, name: true, hex: true } },
      variants: { select: { size: true, quantity: true, isActive: true } },
    },
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

  const errors = validateProductBody(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { name, description, price, salePrice, category, lowStockThreshold = 2, images = [], colors = [], variants = [] } = body;

  try {
    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price),
          salePrice: salePrice ? parseFloat(salePrice) : null,
          category: normalizeCategory(category),
          lowStockThreshold: Math.max(0, parseInt(lowStockThreshold, 10)),
          images,
          isOnSale: !!(salePrice && parseFloat(salePrice) > 0),
          isBestseller: false,
        },
      });

      if (colors.length > 0) {
        await tx.color.createMany({
          data: colors.map((c) => ({
            name: c.name,
            hex: c.hex,
            productId: prod.id,
          })),
        });
      }

      if (variants.length > 0) {
        await tx.variant.createMany({
          data: variants.map((v) => ({
            size: v.size,
            colorName: v.colorName,
            colorHex: v.colorHex,
            image: v.image || null,
            price: v.price ? parseFloat(v.price) : null,
            reducedPrice: v.reducedPrice ? parseFloat(v.reducedPrice) : null,
            quantity: parseInt(v.quantity, 10),
            sku: v.sku?.trim() || null,
            isActive: v.isActive !== false,
            productId: prod.id,
          })),
        });
      }

      return prod;
    });

    return NextResponse.json({ id: product.id }, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { errors: { sku: "Two variants in this product cannot share the same SKU." } },
        { status: 422 }
      );
    }
    console.error("[POST /api/admin/products] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
