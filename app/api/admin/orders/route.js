import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/admin/orders
// Returns all orders (most recent first) with full items -> variant -> product relations
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("[GET /api/admin/orders] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/admin/orders
// Creates a new order with items and automatically decrements variant quantities
// Body: { customerName, email, items: [{ variantId, quantity }] }
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

  const { customerName, email, items } = body;

  if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid: customerName, items" },
      { status: 400 }
    );
  }

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Validate all variants have sufficient stock
      for (const item of items) {
        const variant = await tx.variant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new Error(`Variant "${item.variantId}" not found`);
        }

        if (variant.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${variant.product.name}" - available: ${variant.quantity}, requested: ${item.quantity}`
          );
        }
      }

      // Step 2: Create order
      const order = await tx.order.create({
        data: {
          clientName: customerName.trim(),
          phone: "",
          wilaya: "",
          commune: "",
          deliveryType: "home",
          status: "pending",
          totalPrice: 0, // Will be calculated from items
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Step 3: Decrement variant quantities
      for (const item of items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    console.log(`[POST /api/admin/orders] Order created: ${result.id}`);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/orders] Error:", error);
    
    // Check if it's a custom validation error
    if (error.message.includes("Insufficient stock") || error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
