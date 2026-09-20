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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        select: { id: true, name: true, images: true },
      },
    },
  });

  return NextResponse.json(collections);
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

  const errors = validateCollectionBody(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const { name, image, status = "in_store", productIds = [] } = body;
  const ids = Array.isArray(productIds) ? productIds.filter(Boolean) : [];

  try {
    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        image: image?.trim() || null,
        status,
        products: {
          connect: ids.map((id) => ({ id })),
        },
      },
    });

    return NextResponse.json({ id: collection.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/collections] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
