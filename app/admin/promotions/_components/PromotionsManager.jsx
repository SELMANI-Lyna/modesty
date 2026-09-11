"use client";

import { useEffect, useMemo, useState } from "react";

function formatPrice(amount) {
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(amount) + " DA";
}

export default function PromotionsManager({ initialPromos = [], allProducts = [] }) {
  const [promos, setPromos] = useState(initialPromos);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    setPromos(initialPromos);
  }, [initialPromos]);

  const promoIds = useMemo(() => new Set(promos.map((p) => p.id)), [promos]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allProducts.filter((product) => {
      if (promoIds.has(product.id)) return false;
      if (!q) return true;
      return product.name.toLowerCase().includes(q);
    });
  }, [allProducts, promoIds, search]);

  const selectedProduct = allProducts.find((p) => p.id === productId);

  const addPromo = async () => {
    if (!productId || !salePrice) {
      alert("Choisissez un produit et un prix promo.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, salePrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setPromos((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
      setShowModal(false);
      setSearch("");
      setProductId("");
      setSalePrice("");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePrice = async (product) => {
    const parsed = parseFloat(draftPrice);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Prix invalide");
      return;
    }
    setUpdatingId(product.id);
    try {
      const res = await fetch(`/api/admin/promotions/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salePrice: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setPromos((prev) => prev.map((p) => (p.id === product.id ? data : p)));
      setEditingId(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelPromo = async (product) => {
    if (!confirm(`Annuler la promo sur « ${product.name} » ?`)) return;
    setUpdatingId(product.id);
    try {
      const res = await fetch(`/api/admin/promotions/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnSale: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setPromos((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-end gap-4 px-5 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition"
          >
            Ajouter un produit en promo
          </button>
        </div>

        {promos.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm">Aucun produit en promotion pour le moment.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {promos.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">—</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-400 line-through">{formatPrice(product.price)}</span>
                    {editingId === product.id ? (
                      <input
                        autoFocus
                        type="number"
                        step="1"
                        value={draftPrice}
                        onChange={(e) => setDraftPrice(e.target.value)}
                        onBlur={() => savePrice(product)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            savePrice(product);
                          }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(product.id);
                          setDraftPrice(String(product.salePrice ?? ""));
                        }}
                        className="font-semibold text-emerald-700 hover:underline"
                        title="Cliquer pour modifier"
                      >
                        {formatPrice(product.salePrice)}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={updatingId === product.id}
                  onClick={() => cancelPromo(product)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-60"
                >
                  Annuler la promo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un produit en promo</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900 text-xl">
                ×
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher un produit</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom du produit…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                />
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Choisir…</option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {selectedProduct?.images?.[0] && (
                  <img src={selectedProduct.images[0]} alt="" className="mt-3 w-24 h-24 object-cover rounded-lg border" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau prix</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">Prix actuel : {formatPrice(selectedProduct.price)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                Annuler
              </button>
              <button
                type="button"
                onClick={addPromo}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-black hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Activer la promo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
