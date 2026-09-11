import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        clientName: body.clientName?.trim() !== undefined ? body.clientName.trim() : undefined,
        message: body.message?.trim() !== undefined ? body.message.trim() : undefined,
        rating:
          body.rating === null || body.rating === undefined
            ? null
            : Number.isInteger(Number(body.rating))
            ? Number(body.rating)
            : undefined,
        photos: body.photos !== undefined ? (Array.isArray(body.photos) ? body.photos.filter(Boolean) : []) : undefined,
        approved: body.approved !== undefined ? !!body.approved : undefined,
        storyLink:
          body.storyLink !== undefined
            ? typeof body.storyLink === "string"
              ? body.storyLink.trim() || null
              : null
            : undefined,
        productId: body.productId === null || body.productId === undefined ? body.productId : body.productId,
      },
      include: {
        product: {
          select: { id: true, name: true, images: true },
        },
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    console.error("[PUT /api/feedback/:id] error:", error);
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
    await prisma.feedback.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    console.error("[DELETE /api/feedback/:id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
