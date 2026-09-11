import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { notFound, redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import OrderDetailClient from "./OrderDetailClient";
import LogoutButton from "@/app/admin/LogoutButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

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
    notFound();
  }

  const serializedOrder = JSON.parse(JSON.stringify(order));

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
            >
              <span>← All Orders</span>
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold text-gray-800">
              Order #{order.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono hidden sm:inline">
              {session.user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>

        <OrderDetailClient initialOrder={serializedOrder} />
      </div>
    </div>
  );
}
