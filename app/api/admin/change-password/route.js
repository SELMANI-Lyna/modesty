import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Both fields are required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
  });

  if (!admin) {
    return Response.json({ error: "Admin not found" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!isValid) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: newHash },
  });

  return Response.json({ success: true });
}
