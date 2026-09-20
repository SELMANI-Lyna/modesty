"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

async function uploadFileToCloudinary(file, folder = "shop-collections") {
  const sigRes = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (!sigRes.ok) {
    const err = await sigRes.json();
    throw new Error(err.error || "Failed to get upload signature");
  }

  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } = await sigRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("folder", signedFolder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json().catch(() => null);
    throw new Error(errorData?.error?.message || "Cloudinary upload failed");
  }

  const data = await uploadRes.json();
  return data.secure_url;
}

const STATUS_OPTIONS = [
  { value: "in_store", label: "En boutique / In Store (Visible aux clients)" },
  { value: "not_in_store", label: "Masqué / Not In Store (Non visible)" },
];

export default function CollectionForm({ initialCollection = null, products = [] }) {
  const isEdit = !!initialCollection?.id;
  const router = useRouter();

  const [name, setName] = useState(initialCollection?.name || "");
  const [image, setImage] = useState(initialCollection?.image || "");
  const [status, setStatus] = useState(initialCollection?.status || "in_store");
  const [selectedProductIds, setSelectedProductIds] = useState(
    initialCollection?.products?.map((product) => product.id) || []
  );
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(q));
  }, [products, search]);

  const toggleProduct = (productId) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadFileToCloudinary(file, "shop-collections");
      setImage(url);
    } catch (error) {
      alert(error.message || "Image upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";

    if (!STATUS_OPTIONS.some((option) => option.value === status)) {
      nextErrors.status = "Status is invalid.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      name: name.trim(),
      image: image || null,
      status,
      productIds: selectedProductIds,
    };

    setSaving(true);

    try {
      const res = await fetch(
        isEdit ? `/api/admin/collections/${initialCollection.id}` : "/api/admin/collections",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          alert(data.error || "Save failed");
        }
        setSaving(false);
        return;
      }

      router.push("/admin/collections");
    } catch (error) {
      console.error(error);
      alert("Save failed");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-5">
          <div>
            <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
              placeholder="Summer Edit"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="collection-status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="collection-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collection image</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl border border-dashed border-[#8B7CD8]/30 bg-[#8B7CD8]/5 flex items-center justify-center overflow-hidden">
                {image ? (
                  <img src={image} alt="Collection preview" className="h-full w-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-[#8B7CD8]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                  </svg>
                )}
              </div>

              <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                {uploading ? "Uploading…" : image ? "Replace image" : "Upload image"}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned products</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products…"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/20 focus:border-[#8B7CD8] transition"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">No products match this search.</div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-[#8B7CD8] bg-[#8B7CD8]/5 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.images?.length || 0} image{(product.images?.length || 0) !== 1 ? "s" : ""}</div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center justify-center min-w-[78px] px-2.5 py-1.5 rounded-full text-xs font-semibold border ${
                      isSelected
                        ? "bg-[#8B7CD8] text-white border-[#8B7CD8]"
                        : "bg-white text-gray-700 border-gray-200"
                    }`}>
                      {isSelected ? "Selected" : "Select"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/admin/collections" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] transition shadow-xs disabled:opacity-60"
        >
          {saving ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save Collection" : "Create Collection"}
        </button>
      </div>
    </form>
  );
}
