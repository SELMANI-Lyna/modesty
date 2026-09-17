import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import prisma from "@/app/lib/prisma";

const LOW_STOCK_THRESHOLD = 2;

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
      
      if (totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD) {
        lowStockProducts.push({
          id: product.id,
          name: product.name,
          stock: totalStock,
          threshold: LOW_STOCK_THRESHOLD,
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
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B4CAE] bg-[#8B7CD8]/10 px-3 py-1 rounded-full border border-[#8B7CD8]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CD8]" />
              <span>Session administrateur</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-3">
              Tableau de bord
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Connecté en tant que{" "}
              <span className="font-semibold text-gray-800 font-mono">
                {session.user?.email}
              </span>
            </p>
          </div>
          <div>
            <LogoutButton />
          </div>
        </div>

        {/* Placeholder Information Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Navigation rapide
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Accédez aux différents modules de gestion de votre boutique
              </p>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Rôle : {session.user?.role || "admin"}
            </span>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <Link
              href="/admin/orders"
              className="p-4 bg-white rounded-xl border border-gray-200/80 hover:border-[#8B7CD8]/60 hover:bg-gray-50/40 hover:shadow-2xs transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    📦
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6555B6] transition-colors">
                      Commandes
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Statuts & expéditions
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-[#6555B6] group-hover:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className="p-4 bg-white rounded-xl border border-gray-200/80 hover:border-[#8B7CD8]/60 hover:bg-gray-50/40 hover:shadow-2xs transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    🏷️
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6555B6] transition-colors">
                      Produits
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Catalogue & variantes
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-[#6555B6] group-hover:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/collections"
              className="p-4 bg-white rounded-xl border border-gray-200/80 hover:border-[#8B7CD8]/60 hover:bg-gray-50/40 hover:shadow-2xs transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    🗂️
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6555B6] transition-colors">
                      Collections
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Sélections thématiques
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-[#6555B6] group-hover:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/feedback"
              className="p-4 bg-white rounded-xl border border-gray-200/80 hover:border-[#8B7CD8]/60 hover:bg-gray-50/40 hover:shadow-2xs transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    💬
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6555B6] transition-colors">
                      Avis clients
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Modération & notes
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-[#6555B6] group-hover:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/promotions"
              className="p-4 bg-white rounded-xl border border-gray-200/80 hover:border-[#8B7CD8]/60 hover:bg-gray-50/40 hover:shadow-2xs transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    🎉
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6555B6] transition-colors">
                      Promotions
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Rabais & prix soldés
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-[#6555B6] group-hover:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="p-4 bg-white rounded-xl border border-gray-200/80 hover:border-[#8B7CD8]/60 hover:bg-gray-50/40 hover:shadow-2xs transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    📊
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6555B6] transition-colors">
                      Analytiques
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Ventes & tendances
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-[#6555B6] group-hover:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="p-4 bg-white rounded-xl border border-gray-200/80 hover:border-[#8B7CD8]/60 hover:bg-gray-50/40 hover:shadow-2xs transition-all duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B7CD8]/10 text-[#6555B6] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#6555B6] transition-colors">
                      Paramètres
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Sécurité & compte
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-[#6555B6] group-hover:translate-x-0.5 transition-all text-xs">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* Low Stock Alert Card */}
          {lowStockProducts.length > 0 && (
            <div className="pt-2">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="text-base">⚠️</span>
                  <h3 className="font-semibold text-xs uppercase tracking-wider">
                    Alerte stock faible ({lowStockProducts.length})
                  </h3>
                </div>
                <p className="text-xs text-amber-800">
                  Certains articles ont atteint ou sont passés sous leur seuil d'alerte :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lowStockProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/admin/products/${product.id}/edit`}
                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200/60 hover:border-[#8B7CD8] hover:shadow-2xs transition text-xs"
                    >
                      <span className="font-medium text-gray-900 truncate mr-2">
                        {product.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100/70 text-amber-900 font-semibold font-mono text-[11px] flex-shrink-0">
                        {product.stock} / {product.threshold}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


