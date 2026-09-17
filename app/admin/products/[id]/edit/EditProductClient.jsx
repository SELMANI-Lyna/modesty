"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/app/admin/products/_components/ProductForm";

export default function EditProductClient({ initial }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-500">
              <Link href="/admin" className="hover:text-gray-900 transition">
                Tableau de bord
              </Link>
              <span>•</span>
              <Link href="/admin/products" className="hover:text-gray-900 transition">
                Produits
              </Link>
              <span>•</span>
              <span className="font-semibold text-[#6555B6] truncate max-w-xs inline-block align-bottom">
                {initial?.name || "Modifier le produit"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Modifier le produit
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifiant : <span className="font-mono text-gray-700">{initial?.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition"
            >
              ← Retour aux produits
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] rounded-lg transition shadow-xs"
            >
              + Nouveau produit
            </Link>
          </div>
        </div>

        {/* Product Form */}
        <ProductForm initial={initial} onSaved={() => router.refresh()} />
      </div>
    </div>
  );
}

