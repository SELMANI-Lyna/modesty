"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/app/admin/products/_components/ImageUploader";

// Helper: upload a single file to Cloudinary using our signed endpoint
async function uploadFileToCloudinary(file, folder = "shop-products") {
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

function defaultVariantFor(size, color) {
  return {
    _id: undefined,
    size,
    colorName: color.name,
    colorHex: color.hex,
    image: null,
    price: null,
    reducedPrice: null,
    quantity: 0,
    sku: null,
    isActive: true,
  };
}

// Merge-preserve: given currentVariants and sizes/colors, produce new list preserving matching rows
function mergeVariants(currentVariants, sizes, colors) {
  const map = new Map();
  for (const v of currentVariants) {
    map.set(`${v.size}||${v.colorName}`, v);
  }

  const next = [];
  for (const size of sizes) {
    for (const color of colors) {
      const key = `${size}||${color.name}`;
      if (map.has(key)) {
        next.push(map.get(key));
      } else {
        next.push(defaultVariantFor(size, color));
      }
    }
  }
  return next;
}

export default function ProductForm({ initial = null, onSaved = () => {} }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [salePrice, setSalePrice] = useState(initial?.salePrice ?? "");
  const CATEGORY_OPTIONS = [
    { value: "JUPE", label: "Jupe" },
    { value: "ENSEMBLE", label: "Ensemble" },
    { value: "ROBE", label: "Robe" },
    { value: "HIJAB", label: "Hijab" },
    { value: "PANTALON", label: "Pantalon" },
    { value: "VESTE", label: "Veste" },
  ];

  const [category, setCategory] = useState(initial?.category || "JUPE");
  const [lowStockThreshold, setLowStockThreshold] = useState(initial?.lowStockThreshold ?? 2);
  const [images, setImages] = useState(initial?.images || []);

  // Options
  const [sizeInput, setSizeInput] = useState("");
  const [sizes, setSizes] = useState(initial?.variants ? Array.from(new Set(initial.variants.map((v) => v.size))) : []);

  const [colorInput, setColorInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("#ff0000");
  const [colors, setColors] = useState(
    initial?.colors && initial.colors.length > 0
      ? initial.colors.map((c) => ({ name: c.name, hex: c.hex }))
      : []
  );

  // Variants state: keep full objects including _id when editing existing
  const [variants, setVariants] = useState(
    initial?.variants
      ? initial.variants.map((v) => ({
          _id: v.id,
          size: v.size,
          colorName: v.colorName,
          colorHex: v.colorHex,
          image: v.image || null,
          price: v.price ?? null,
          reducedPrice: v.reducedPrice ?? null,
          quantity: v.quantity ?? 0,
          sku: v.sku || null,
          isActive: v.isActive,
        }))
      : []
  );

  // Validation
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const isEdit = !!initial?.id;

  // When sizes or colors change, merge variants preserving existing data
  useEffect(() => {
    if (sizes.length > 0 && colors.length > 0) {
      setVariants((cur) => mergeVariants(cur, sizes, colors));
    } else {
      setVariants([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes, colors]);

  // Add size
  const addSize = (val) => {
    const v = val?.trim();
    if (!v) return;
    if (sizes.includes(v)) return;
    setSizes((s) => [...s, v]);
    setSizeInput("");
  };

  // Add color
  const addColor = (name, hex) => {
    const n = name?.trim();
    if (!n) return;
    if (colors.some((c) => c.name === n)) return;
    setColors((c) => [...c, { name: n, hex }]);
    setColorInput("");
  };

  const removeSize = (s) => setSizes((arr) => arr.filter((x) => x !== s));
  const removeColor = (n) => setColors((arr) => arr.filter((c) => c.name !== n));

  // Variant helpers
  const updateVariant = (index, patch) => {
    setVariants((arr) => {
      const next = arr.slice();
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleVariantImage = async (index, file) => {
    try {
      const url = await uploadFileToCloudinary(file, "shop-variants");
      updateVariant(index, { image: url });
    } catch (err) {
      alert(err.message || "Upload failed");
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSavedMessage("");
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) nextErrors.price = "Price must be a positive number.";
    variants.forEach((v, i) => {
      const qty = Number(v.quantity);
      if (!Number.isInteger(qty) || qty < 0) nextErrors[`variant_${i}_quantity`] = `Row "${v.size}-${v.colorName}": quantity must be a non-negative whole number.`;
      if (v.price && (isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0)) nextErrors[`variant_${i}_price`] = `Row "${v.size}-${v.colorName}": price override must be positive.`;
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Build payload
    const payload = {
      name,
      description,
      price: String(price),
      salePrice: salePrice ? String(salePrice) : null,
      category: category || "JUPE",
      lowStockThreshold: parseInt(lowStockThreshold, 10),
      images,
      colors,
      variants: variants.map((v) => ({
        _id: v._id,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex,
        image: v.image || null,
        price: v.price ? String(v.price) : null,
        reducedPrice: v.reducedPrice ? String(v.reducedPrice) : null,
        quantity: String(v.quantity),
        sku: v.sku || null,
        isActive: v.isActive,
      })),
    };

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/products/${initial.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
      setSaving(false);
      setSavedMessage("Product saved successfully!");
      onSaved(data.id || initial?.id);
    } catch (err) {
      console.error(err);
      alert("Save failed");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {savedMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center justify-between text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">✓</span>
            <span className="font-medium">{savedMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedMessage("")}
            className="text-green-700 hover:text-green-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}

          <label className="block text-sm font-medium mt-4">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2 h-28" />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className="mt-1 block w-full rounded border px-3 py-2" />
              {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Sale Price</label>
              <input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} type="number" step="0.01" className="mt-1 block w-full rounded border px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Low Stock Threshold</label>
              <input value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} type="number" min="0" className="mt-1 block w-full rounded border px-3 py-2" />
              <p className="text-xs text-gray-500 mt-1">Alert when stock drops to this level</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Product Images</label>
          <div className="mt-2">
            <ImageUploader images={images} onChange={setImages} folder="shop-products" />
          </div>
        </div>
      </div>

      {/* Options builder */}
      <div className="border-t pt-4">
        <h3 className="font-medium">Options</h3>

        {/* Sizes */}
        <div className="mt-3">
          <label className="block text-sm font-medium">Sizes</label>
          <div className="mt-2 flex gap-2">
            <input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(sizeInput); } }} className="rounded border px-3 py-2" placeholder="e.g. S, M, L" />
            <button type="button" onClick={() => addSize(sizeInput)} className="px-3 py-2 bg-gray-800 text-white rounded">Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {sizes.map((s) => (
              <div key={s} className="px-3 py-1 bg-gray-100 rounded flex items-center gap-2">
                <span>{s}</span>
                <button type="button" onClick={() => removeSize(s)} className="text-sm text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="mt-6">
          <label className="block text-sm font-medium">Colors</label>
          <div className="mt-2 flex gap-2 items-center">
            <input value={colorInput} onChange={(e) => setColorInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(colorInput, colorHexInput); } }} placeholder="e.g. Pink" className="rounded border px-3 py-2" />
            <input type="color" value={colorHexInput} onChange={(e) => setColorHexInput(e.target.value)} className="w-12 h-10 p-0" />
            <button type="button" onClick={() => addColor(colorInput, colorHexInput)} className="px-3 py-2 bg-gray-800 text-white rounded">Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {colors.map((c) => (
              <div key={c.name} className="px-3 py-1 bg-gray-100 rounded flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ background: c.hex }} />
                <span>{c.name}</span>
                <button type="button" onClick={() => removeColor(c.name)} className="text-sm text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Variants table */}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-medium">Variants</h3>
        {sizes.length === 0 || colors.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">Add at least one Size and one Color to generate variants.</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Status</th>
                  <th className="p-2">Photo</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Reduced Price</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">SKU</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={`${v.size}-${v.colorName}`} className="border-t">
                    <td className="p-2 align-top">
                      <label className="inline-flex items-center">
                        <input type="checkbox" checked={v.isActive} onChange={(e) => updateVariant(i, { isActive: e.target.checked })} />
                        <span className="ml-2 text-sm">Active</span>
                      </label>
                    </td>
                    <td className="p-2 align-top">
                      <div className="w-20 h-20 border rounded flex items-center justify-center bg-gray-50">
                        {v.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.image} alt="variant" className="w-full h-full object-cover" />
                        ) : (
                          <label className="cursor-pointer text-xs text-gray-500">
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVariantImage(i, f); }} />
                          </label>
                        )}
                      </div>
                    </td>
                    <td className="p-2 align-top">
                      <div className="text-sm font-medium">{v.size}-{v.colorName}</div>
                      <div className="text-xs text-gray-500">{v.colorHex}</div>
                    </td>
                    <td className="p-2 align-top">
                      <input type="number" step="0.01" value={v.price ?? ""} onChange={(e) => updateVariant(i, { price: e.target.value })} className="rounded border px-2 py-1 w-28" />
                      {errors[`variant_${i}_price`] && <div className="text-xs text-red-600">{errors[`variant_${i}_price`]}</div>}
                    </td>
                    <td className="p-2 align-top">
                      <input type="number" step="0.01" value={v.reducedPrice ?? ""} onChange={(e) => updateVariant(i, { reducedPrice: e.target.value })} className="rounded border px-2 py-1 w-28" />
                    </td>
                    <td className="p-2 align-top">
                      <input type="number" value={v.quantity} onChange={(e) => updateVariant(i, { quantity: Number(e.target.value) })} className="rounded border px-2 py-1 w-24" />
                      {errors[`variant_${i}_quantity`] && <div className="text-xs text-red-600">{errors[`variant_${i}_quantity`]}</div>}
                    </td>
                    <td className="p-2 align-top">
                      <input value={v.sku ?? ""} onChange={(e) => updateVariant(i, { sku: e.target.value })} className="rounded border px-2 py-1 w-40" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-6 border-t flex items-center justify-between">
        <div className="text-sm text-gray-500">{isEdit ? "Editing product" : "Create new product"}</div>
        <div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? "Saving…" : "Save product"}</button>
        </div>
      </div>
    </form>
  );
}
