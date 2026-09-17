import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/app/lib/prisma";
import LogoutButton from "@/app/admin/LogoutButton";
import FeedbackManager from "./_components/FeedbackManager";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [feedbacks, products] = await Promise.all([
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, name: true, images: true } } },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, images: true },
    }),
  ]);

  const serializedFeedbacks = JSON.parse(JSON.stringify(feedbacks));
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs text-gray-500 hover:text-[#8B7CD8] transition">
                ← Dashboard
              </Link>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-[#6555B6]">Feedback</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Feedback Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">Approve customer feedback and keep product reviews organized.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <span className="text-xs text-gray-500 block">Logged in as</span>
              <span className="text-xs font-semibold text-gray-900 font-mono">{session.user?.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>

        <FeedbackManager initialFeedbacks={serializedFeedbacks} products={serializedProducts} />
      </div>
    </div>
  );
}
