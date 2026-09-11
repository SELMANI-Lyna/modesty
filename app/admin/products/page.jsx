import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/app/admin/LogoutButton";
import ProductsList from "./_components/ProductsList";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      colors: { select: { id: true, name: true, hex: true } },
      variants: { select: { size: true, quantity: true, isActive: true } },
    },
  });

  const serialized = JSON.parse(JSON.stringify(products));

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-900 transition">
                ← Dashboard
              </Link>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-gray-700">Products</span>
              <span className="text-gray-300">•</span>
              <Link href="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900 transition">
                Orders
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              All catalog products with color swatches, sizes, and live stock totals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </Link>
            <div className="hidden md:block text-right">
              <span className="text-xs text-gray-500 block">Logged in as</span>
              <span className="text-xs font-semibold text-gray-900 font-mono">{session.user?.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Products list */}
        <ProductsList initialProducts={serialized} />
      </div>
    </div>
  );
}
