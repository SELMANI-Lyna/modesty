import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
];

// GET /api/admin/orders/[id]
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(`[GET /api/admin/orders/${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/[id]
// Updates the order status.
// ARCHITECTURE NOTE: Changing an order's status does NOT modify Variant.quantity.
// Stock is managed manually exclusively on the product edit page.
export async function PATCH(req, { params }) {
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

  const { status } = body;
  const normalizedStatus = status?.trim()?.toLowerCase();

  if (!normalizedStatus || !ALLOWED_STATUSES.includes(normalizedStatus)) {
    return NextResponse.json(
      {
        error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      },
      { status: 422 }
    );
  }

  try {
    // Check if order exists
    const existing = await prisma.order.findUnique({
      where: { id },
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

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isTransitionToReturned = normalizedStatus === "returned" && existing.status !== "returned";
    const isTransitionFromReturned = existing.status === "returned" && normalizedStatus !== "returned";

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (isTransitionToReturned) {
        for (const item of existing.items) {
          if (item.variant) {
            const updatedVar = await tx.variant.update({
              where: { id: item.variant.id },
              data: {
                quantity: { increment: item.quantity },
              },
              include: { product: true },
            });
            const LOW_STOCK_THRESHOLD = 2;
            if (updatedVar.quantity > LOW_STOCK_THRESHOLD && updatedVar.lowStockAlertSent) {
              await tx.variant.update({
                where: { id: updatedVar.id },
                data: { lowStockAlertSent: false },
              });
            }
          }
        }
      } else if (isTransitionFromReturned) {
        for (const item of existing.items) {
          if (item.variant) {
            await tx.variant.update({
              where: { id: item.variant.id },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
          }
        }
      }

      return await tx.order.update({
        where: { id },
        data: {
          status: normalizedStatus,
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
    });

    console.log(
      `[PATCH /api/admin/orders/${id}] Status updated: "${existing.status}" -> "${normalizedStatus}"`
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error(`[PATCH /api/admin/orders/${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}

// Support PUT as alias for clients that send PUT
export async function PUT(req, ctx) {
  return PATCH(req, ctx);
}
