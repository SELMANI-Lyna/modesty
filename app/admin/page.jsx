import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import prisma from "@/app/lib/prisma";

async function getLowStockProducts() {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
    });

    const lowStockProducts = [];
    for (const product of products) {
      const totalStock = product.variants
        .filter((v) => v.isActive)
        .reduce((sum, v) => sum + v.quantity, 0);
      
      if (totalStock > 0 && totalStock <= product.lowStockThreshold) {
        lowStockProducts.push({
          id: product.id,
          name: product.name,
          stock: totalStock,
          threshold: product.lowStockThreshold,
        });
      }
    }

    return lowStockProducts;
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }
}

export default async function AdminDashboardPage() {
  // Server-side session verification (defense-in-depth)
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const lowStockProducts = await getLowStockProducts();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              Authenticated Session
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome, logged in as{" "}
              <span className="font-semibold text-gray-900">
                {session.user?.email}
              </span>
            </p>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>

        {/* Placeholder Information Card */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Session Details
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block text-xs">Admin ID</span>
              <span className="font-mono text-gray-800 break-all">
                {session.user?.id || "N/A"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-500 block text-xs">Role</span>
              <span className="font-mono text-gray-800">
                {session.user?.role || "admin"}
              </span>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/orders"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-black shadow-xs hover:shadow-sm transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-lg">
                    📦
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                      Orders Management
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      View client orders and change statuses
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-black transition">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-black shadow-xs hover:shadow-sm transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center text-lg">
                    🏷️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                      Products
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Browse, edit, and manage catalog products
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-black transition">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/collections"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-black shadow-xs hover:shadow-sm transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg">
                    🗂️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                      Collections
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Create and manage featured product collections
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-black transition">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/feedback"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-black shadow-xs hover:shadow-sm transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center text-lg">
                    💬
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                      Feedback
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage customer reviews and approval status
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-black transition">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/promotions"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-black shadow-xs hover:shadow-sm transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center text-lg">
                    🏷️
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                      Promotions
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Set promotional prices on existing products
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-black transition">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-black shadow-xs hover:shadow-sm transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg">
                    📊
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                      Analytics
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      View sales data and performance metrics
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-black transition">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* Low Stock Alert Card */}
          {lowStockProducts.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900">Produits en stock faible</h3>
                  <p className="text-sm text-amber-800 mt-1 mb-3">
                    {lowStockProducts.length} produit{lowStockProducts.length !== 1 ? "s" : ""} ayant un stock proche du seuil d'alerte :
                  </p>
                  <div className="space-y-2">
                    {lowStockProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center justify-between w-full p-2 bg-white rounded-lg border border-amber-100 hover:border-amber-300 hover:bg-amber-50/30 transition text-sm"
                      >
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="text-amber-700 font-semibold">
                          {product.stock}/{product.threshold}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
