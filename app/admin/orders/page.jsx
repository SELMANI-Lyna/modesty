import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/app/admin/LogoutButton";
import OrdersManager from "./_components/OrdersManager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  // Fetch all orders with full relation tree (ordered most recent first)
  const orders = await prisma.order.findMany({
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

  // Serialize for client component
  const serializedOrders = JSON.parse(JSON.stringify(orders));

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation & Header */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin"
                className="text-xs text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
              >
                <span>← Dashboard</span>
              </Link>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-gray-700">Orders</span>
              <span className="text-gray-300">•</span>
              <Link
                href="/admin/products"
                className="text-xs text-gray-500 hover:text-gray-900 transition"
              >
                Products
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Customer Orders
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review incoming client orders, update delivery statuses, and inspect ordered variants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-xs text-gray-500 block">Logged in as</span>
              <span className="text-xs font-semibold text-gray-900 font-mono">
                {session.user?.email}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Orders Management Client View */}
        <OrdersManager initialOrders={serializedOrders} />
      </div>
    </div>
  );
}
