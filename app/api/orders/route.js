import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getDeliveryFee } from "@/lib/delivery";
import { getProductUnitPrice } from "@/lib/pricing";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    clientName,
    phone,
    wilaya,
    commune,
    deliveryType,
    variantId,
    quantity = 1,
  } = body;

  if (!clientName?.trim()) {
    return NextResponse.json({ error: "Le nom est requis." }, { status: 422 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: "Le téléphone est requis." }, { status: 422 });
  }
  if (!wilaya?.trim() || !commune?.trim()) {
    return NextResponse.json({ error: "Wilaya et commune sont requises." }, { status: 422 });
  }
  if (!["home", "agency"].includes(deliveryType)) {
    return NextResponse.json({ error: "Type de livraison invalide." }, { status: 422 });
  }
  if (!variantId) {
    return NextResponse.json({ error: "Veuillez choisir une variante." }, { status: 422 });
  }

  const qty = parseInt(quantity, 10);
  if (!Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ error: "Quantité invalide." }, { status: 422 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const variant = await tx.variant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (!variant || !variant.isActive) {
        throw new Error("VARIANT_UNAVAILABLE");
      }
      if (variant.quantity < qty) {
        throw new Error("OUT_OF_STOCK");
      }

      const unitPrice = getProductUnitPrice(variant.product, variant);
      const deliveryFee = getDeliveryFee(wilaya, deliveryType);
      const totalPrice = unitPrice * qty + deliveryFee;

      const created = await tx.order.create({
        data: {
          clientName: clientName.trim(),
          phone: phone.trim(),
          wilaya: wilaya.trim(),
          commune: commune.trim(),
          deliveryType,
          status: "pending",
          totalPrice,
          items: {
            create: {
              variantId: variant.id,
              quantity: qty,
              priceAtOrder: unitPrice,
            },
          },
        },
      });

      await tx.variant.update({
        where: { id: variant.id },
        data: { quantity: { decrement: qty } },
      });

      return created;
    });

    return NextResponse.json({ id: order.id, totalPrice: order.totalPrice }, { status: 201 });
  } catch (error) {
    if (error.message === "OUT_OF_STOCK") {
      return NextResponse.json({ error: "Stock insuffisant pour cette variante." }, { status: 409 });
    }
    if (error.message === "VARIANT_UNAVAILABLE") {
      return NextResponse.json({ error: "Cette variante n'est plus disponible." }, { status: 404 });
    }
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
