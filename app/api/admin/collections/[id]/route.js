import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

function validateCollectionBody(body) {
  const errors = {};
  const { name, status } = body;

  if (!name?.trim()) {
    errors.name = "Name is required.";
  }

  if (status && !["in_store", "not_in_store"].includes(status)) {
    errors.status = "Status must be either 'in_store' or 'not_in_store'.";
  }

  return errors;
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, images: true },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json(collection);
}

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

  const errors = validateCollectionBody(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { name, image, status = "not_in_store", productIds = [] } = body;
  const ids = Array.isArray(productIds) ? productIds.filter(Boolean) : [];

  try {
    const existing = await prisma.collection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name: name.trim(),
        image: image?.trim() || null,
        status,
        products: {
          set: ids.map((productId) => ({ id: productId })),
        },
      },
    });

    return NextResponse.json({ id: collection.id });
  } catch (error) {
    console.error("[PUT /api/admin/collections/:id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    console.error("[DELETE /api/admin/collections/:id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
