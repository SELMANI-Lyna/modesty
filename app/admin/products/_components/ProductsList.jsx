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

function StockBadge({ variants, lowStockThreshold = 2 }) {
  const stock = totalActiveStock(variants);
  const isSoldOut = stock === 0;
  const isLowStock = stock > 0 && stock <= lowStockThreshold;
  
  let cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let label = "OK";
  let icon = "✓";
  
  if (isSoldOut) {
    cls = "bg-red-50 text-red-700 border-red-200";
    label = "Épuisé";
    icon = "●";
  } else if (isLowStock) {
    cls = "bg-amber-50 text-amber-700 border-amber-200";
    label = "Stock faible";
    icon = "⚠";
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
        <span className="w-1.5 h-1.5 flex-shrink-0">{icon}</span>
        {stock}
      </span>
      {isLowStock && (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200`}>
          {label}
        </span>
      )}
      {isSoldOut && (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-red-700 bg-red-50 border border-red-200`}>
          {label}
        </span>
      )}
    </div>
  );
}

function DeleteModal({ product, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete product?</h3>
        <p className="text-sm text-gray-600 mb-5">
          <span className="font-medium text-gray-900">"{product.name}"</span> will be permanently
          deleted along with all its colors and variants. This cannot be undone.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? "Deleting…" : "Delete"}
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

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  async function handleDeleteConfirm() {
    if (!toDelete) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/products/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setProducts((prev) => prev.filter((p) => p.id !== toDelete.id));
      setToDelete(null);
    } catch {
      setDeleteError("Could not delete the product. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {toDelete && (
        <DeleteModal
          product={toDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setToDelete(null); setDeleteError(""); }}
          isDeleting={isDeleting}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition"
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {filtered.length} / {products.length} product{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {deleteError && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">
            {deleteError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Colors</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Sizes</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Stock</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    {search ? "No products match your search." : "No products yet. Add one to get started."}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Product */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
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
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium border border-gray-200 capitalize">
                        {product.category}
                      </span>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-900">{product.price.toLocaleString()} DA</span>
                      {product.salePrice && (
                        <span className="block text-xs text-emerald-600 font-medium">
                          Sale: {product.salePrice.toLocaleString()} DA
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
                      <StockBadge variants={product.variants} lowStockThreshold={product.lowStockThreshold} />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition border border-gray-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => { setDeleteError(""); setToDelete(product); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
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
