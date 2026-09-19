"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uniqueColors(colors) {
  const seen = new Set();
  return colors.filter((c) => {
    if (seen.has(c.hex)) return false;
    seen.add(c.hex);
    return true;
  });
}

function uniqueSizes(variants) {
  const seen = new Set();
  return variants.map((v) => v.size).filter((s) => {
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}

function totalActiveStock(variants) {
  return variants.filter((v) => v.isActive).reduce((sum, v) => sum + v.quantity, 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorSwatches({ colors }) {
  const uniq = uniqueColors(colors);
  const visible = uniq.slice(0, 5);
  const extra = uniq.length - 5;
  if (uniq.length === 0) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((c) => (
        <span
          key={c.id}
          title={c.name}
          className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0 shadow-sm"
          style={{ backgroundColor: c.hex }}
        />
      ))}
      {extra > 0 && <span className="text-xs text-gray-500 font-medium">+{extra}</span>}
    </div>
  );
}

function SizeChips({ variants }) {
  const sizes = uniqueSizes(variants);
  if (sizes.length === 0) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sizes.map((s) => (
        <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium border border-gray-200">
          {s}
        </span>
      ))}
    </div>
  );
}

const LOW_STOCK_THRESHOLD = 2;

function StockBadge({ variants }) {
  const stock = totalActiveStock(variants);
  const isSoldOut = stock === 0;
  const isLowStock = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  
  let cls = "bg-[#8B7CD8]/10 text-[#5B4CAE] border-[#8B7CD8]/25";
  let label = "En stock";
  let icon = "✓";
  
  if (isSoldOut) {
    cls = "bg-gray-100 text-gray-500 border-gray-200";
    label = "Épuisé";
    icon = "●";
  } else if (isLowStock) {
    cls = "bg-amber-50 text-amber-800 border-amber-200";
    label = "Stock faible";
    icon = "⚠";
  }
  
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
        <span className="text-[10px]">{icon}</span>
        <span>{stock}</span>
      </span>
      {isLowStock && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200">
          {label}
        </span>
      )}
      {isSoldOut && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium text-gray-600 bg-gray-100 border border-gray-200">
          {label}
        </span>
      )}
    </div>
  );
}

function DeleteModal({
  product,
  onConfirm,
  onCancel,
  isDeleting,
  error,
  ordersWarning,
  forceChecked,
  setForceChecked,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 p-6 max-w-md w-full">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1.5">Supprimer ce produit ?</h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Le produit <span className="font-semibold text-gray-900">« {product.name} »</span> sera définitivement
          supprimé ainsi que toutes ses déclinaisons et photos associées.
        </p>

        {ordersWarning && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <p className="leading-snug">
                Ce produit figure dans <span className="font-bold">{ordersWarning.orderCount}</span> ligne(s) de commande(s) existante(s).
              </p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer pt-1 border-t border-amber-200/60">
              <input
                type="checkbox"
                checked={forceChecked}
                onChange={(e) => setForceChecked(e.target.checked)}
                className="mt-0.5 rounded border-amber-300 text-[#8B7CD8] focus:ring-[#8B7CD8]"
              />
              <span className="text-[11px] font-medium text-amber-900 leading-tight select-none">
                Confirmer la suppression forcée (supprime également les lignes associées dans l&apos;historique des commandes)
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-snug">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(ordersWarning ? forceChecked : false)}
            disabled={isDeleting || (ordersWarning && !forceChecked)}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            {isDeleting
              ? "Suppression…"
              : ordersWarning
              ? "Forcer la suppression"
              : "Confirmer la suppression"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProductsList({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [ordersWarning, setOrdersWarning] = useState(null);
  const [forceChecked, setForceChecked] = useState(false);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  async function handleDeleteConfirm(force = false) {
    if (!toDelete) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const url = `/api/admin/products/${toDelete.id}${force ? "?force=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.hasOrders) {
        setOrdersWarning(data);
        setIsDeleting(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer le produit.");
      }

      setProducts((prev) => prev.filter((p) => p.id !== toDelete.id));
      setToDelete(null);
      setOrdersWarning(null);
      setForceChecked(false);
    } catch (err) {
      setDeleteError(err.message || "Impossible de supprimer le produit. Veuillez réessayer.");
    } finally {
      setIsDeleting(false);
    }
  }

  const handleCloseModal = () => {
    setToDelete(null);
    setDeleteError("");
    setOrdersWarning(null);
    setForceChecked(false);
  };

  return (
    <>
      {toDelete && (
        <DeleteModal
          product={toDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleCloseModal}
          isDeleting={isDeleting}
          error={deleteError}
          ordersWarning={ordersWarning}
          forceChecked={forceChecked}
          setForceChecked={setForceChecked}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par nom ou catégorie…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition"
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {filtered.length} / {products.length} produit{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {!toDelete && deleteError && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-xs text-red-700">
            {deleteError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Produit</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Catégorie</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Prix</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Couleurs</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Tailles</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Stock</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-gray-400 text-sm">
                    {search ? "Aucun produit ne correspond à votre recherche." : "Aucun produit pour le moment. Cliquez sur « Ajouter un produit » pour commencer."}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-[#8B7CD8]/5 transition-colors">
                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-11 h-11 rounded-lg object-cover border border-gray-200/80 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-gray-900 leading-tight block">{product.name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(product.createdAt).toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium border border-gray-200/80 capitalize">
                        {product.category}
                      </span>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-900">{product.price.toLocaleString()} DA</span>
                      {product.salePrice && (
                        <span className="block text-xs text-[#6555B6] font-medium">
                          Promo : {product.salePrice.toLocaleString()} DA
                        </span>
                      )}
                    </td>
                    {/* Colors */}
                    <td className="px-4 py-3.5">
                      <ColorSwatches colors={product.colors} />
                    </td>
                    {/* Sizes */}
                    <td className="px-4 py-3.5">
                      <SizeChips variants={product.variants} />
                    </td>
                    {/* Stock */}
                    <td className="px-4 py-3.5">
                      <StockBadge variants={product.variants} />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:border-[#8B7CD8] hover:text-[#6555B6] rounded-lg transition border border-gray-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modifier
                        </Link>
                        <button
                          onClick={() => { setDeleteError(""); setToDelete(product); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/80 hover:border-red-200 rounded-lg transition border border-gray-200"
                          title="Supprimer le produit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
