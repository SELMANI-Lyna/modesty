import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { id: true, name: true, images: true },
        },
      },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("[GET /api/feedback] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { clientName, message, rating, photos = [], productId = null, approved = false, storyLink = null } = body;

    if (!clientName?.trim()) {
      return NextResponse.json({ error: "Client name is required." }, { status: 422 });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 422 });
    }

    const parsedRating = Number(rating);
    if (rating !== undefined && rating !== null && (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 422 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        clientName: clientName.trim(),
        message: message.trim(),
        rating: parsedRating || null,
        photos: Array.isArray(photos) ? photos.filter(Boolean) : [],
        approved: !!approved,
        storyLink: typeof storyLink === "string" ? storyLink.trim() || null : null,
        productId: productId || null,
      },
      include: {
        product: {
          select: { id: true, name: true, images: true },
        },
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("[POST /api/feedback] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
