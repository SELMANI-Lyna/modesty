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
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navigation & Header */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
              <Link href="/admin" className="hover:text-gray-900 transition">
                Tableau de bord
              </Link>
              <span>•</span>
              <span className="font-semibold text-[#6555B6]">Commandes</span>
              <span>•</span>
              <Link href="/admin/products" className="hover:text-gray-900 transition">
                Produits
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Commandes clients
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Consultez les commandes, modifiez les statuts d'expédition et accédez aux détails
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-[11px] text-gray-400 block">Connecté en tant que</span>
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

