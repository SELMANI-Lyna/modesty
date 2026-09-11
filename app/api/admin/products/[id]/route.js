import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// ─── GET: fetch product for the edit form ────────────────────────────────────

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { colors: true, variants: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// ─── Shared validation ───────────────────────────────────────────────────────

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

  if (body.salePrice) {
    const parsedSalePrice = parseFloat(body.salePrice);
    if (isNaN(parsedSalePrice) || parsedSalePrice <= 0) {
      errors.salePrice = "Sale price must be a positive number.";
    }
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

// ─── PUT: update product ──────────────────────────────────────────────────────

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

  console.log(`[PUT /api/admin/products/${id}] Updating product "${body?.name}"...`);

  const errors = validateProductBody(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { name, description, price, salePrice, category, lowStockThreshold = 2, images = [], colors = [], variants = [] } = body;

  // Make sure the product exists
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: { include: { orderItems: { take: 1 } } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Build maps for smart variant merge
  const existingVariantMap = new Map(existing.variants.map((v) => [v.id, v]));

  // Incoming variants with an _id → update
  // Incoming variants without _id → create
  // Existing variants not referenced in incoming list → delete (or deactivate if they have orders)
  const incomingIds = new Set(variants.filter((v) => v._id).map((v) => v._id));
  const toDelete = existing.variants.filter((v) => !incomingIds.has(v.id));

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update product scalar fields
      await tx.product.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price),
          salePrice: salePrice ? parseFloat(salePrice) : null,
          category: normalizeCategory(category),
          lowStockThreshold: Math.max(0, parseInt(lowStockThreshold, 10)),
          images,
          isOnSale: !!(salePrice && parseFloat(salePrice) > 0),
        },
      });

      // 2. Replace colors (colors don't hold user-editable data worth merging)
      await tx.color.deleteMany({ where: { productId: id } });
      if (colors.length > 0) {
        await tx.color.createMany({
          data: colors.map((c) => ({
            name: c.name,
            hex: c.hex,
            productId: id,
          })),
        });
      }

      // 3. Handle removed variants: delete if no orders, deactivate if they have orders
      for (const v of toDelete) {
        const hasOrders = v.orderItems && v.orderItems.length > 0;
        if (hasOrders) {
          // Preserve for order history — just deactivate
          await tx.variant.update({
            where: { id: v.id },
            data: { isActive: false, quantity: 0 },
          });
        } else {
          await tx.variant.delete({ where: { id: v.id } });
        }
      }

      // 4. Update existing variants and create new ones
      for (const v of variants) {
        const variantData = {
          size: v.size,
          colorName: v.colorName,
          colorHex: v.colorHex,
          image: v.image || null,
          price: v.price ? parseFloat(v.price) : null,
          reducedPrice: v.reducedPrice ? parseFloat(v.reducedPrice) : null,
          quantity: parseInt(v.quantity, 10),
          sku: v.sku?.trim() || null,
          isActive: v.isActive !== false,
        };

        if (v._id && existingVariantMap.has(v._id)) {
          await tx.variant.update({
            where: { id: v._id },
            data: variantData,
          });
        } else {
          await tx.variant.create({
            data: { ...variantData, productId: id },
          });
        }
      }
    });

    console.log(`[PUT /api/admin/products/${id}] Successfully updated!`);
    return NextResponse.json({ id });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { errors: { sku: "Two variants in this product cannot share the same SKU." } },
        { status: 422 }
      );
    }
    console.error("[PUT /api/admin/products/:id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: remove a product (cascade deletes colors + variants) ─────────────

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.error("[DELETE /api/admin/products/:id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

