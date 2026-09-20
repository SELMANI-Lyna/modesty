import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/app/admin/products/_components/ImageUploader";
import ColorPicker from "@/app/admin/products/_components/ColorPicker";

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

function defaultVariantFor(size = "Unique", color = { name: "Standard", hex: "#000000" }) {
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
    { value: "SCARF", label: "Scarf / Foulard (خمارات)" },
    { value: "ABAYA", label: "Abaya (عبايا)" },
  ];

  const [category, setCategory] = useState(initial?.category || "JUPE");
  const [images, setImages] = useState(initial?.images || []);

  // Options: filter out default size "Unique" and color "Standard" from tags if present
  const [sizeInput, setSizeInput] = useState("");
  const [sizes, setSizes] = useState(
    initial?.variants
      ? Array.from(new Set(initial.variants.map((v) => v.size))).filter((s) => s !== "Unique")
      : []
  );

  const [colors, setColors] = useState(
    initial?.colors && initial.colors.length > 0
      ? initial.colors
          .filter((c) => c.name !== "Standard" && c.name !== "Unique")
          .map((c) => ({ name: c.name, hex: c.hex }))
      : []
  );

  // Variants state: keep full objects including _id when editing existing
  const [variants, setVariants] = useState(() => {
    if (initial?.variants && initial.variants.length > 0) {
      return initial.variants.map((v) => ({
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
      }));
    }
    return [defaultVariantFor("Unique", { name: "Standard", hex: "#000000" })];
  });

  // Validation
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const isEdit = !!initial?.id;

  // When sizes or colors change: if both empty, keep 1 default variant; otherwise generate combinations
  useEffect(() => {
    if (sizes.length === 0 && colors.length === 0) {
      setVariants((cur) => {
        const existingDefault = cur.find(
          (v) => v.size === "Unique" && (v.colorName === "Standard" || v.colorName === "Unique")
        );
        if (existingDefault) return [existingDefault];
        return [defaultVariantFor("Unique", { name: "Standard", hex: "#000000" })];
      });
    } else {
      const effectiveSizes = sizes.length > 0 ? sizes : ["Unique"];
      const effectiveColors = colors.length > 0 ? colors : [{ name: "Standard", hex: "#000000" }];
      setVariants((cur) => mergeVariants(cur, effectiveSizes, effectiveColors));
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
    if (colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) return;
    setColors((c) => [...c, { name: n, hex }]);
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

  // Total stock calculation for preview
  const totalStockCount = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
  }, [variants]);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSavedMessage("");
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Le nom du produit est requis.";
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) nextErrors.price = "Le prix doit être un nombre positif.";
    variants.forEach((v, i) => {
      const qty = Number(v.quantity);
      if (!Number.isInteger(qty) || qty < 0) nextErrors[`variant_${i}_quantity`] = `Ligne "${v.size}-${v.colorName}": la quantité doit être un entier positif ou nul.`;
      if (v.price && (isNaN(parseFloat(v.price)) || parseFloat(v.price) <= 0)) nextErrors[`variant_${i}_price`] = `Ligne "${v.size}-${v.colorName}": le prix spécifique doit être positif.`;
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
      lowStockThreshold: 2,
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
      setSavedMessage("Produit enregistré avec succès !");
      onSaved(data.id || initial?.id);
    } catch (err) {
      console.error(err);
      alert("Enregistrement échoué");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Toast feedback messages */}
      {savedMessage && (
        <div className="p-4 rounded-xl bg-[#8B7CD8]/10 border border-[#8B7CD8]/30 text-[#4E409D] flex items-center justify-between text-sm shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-[#8B7CD8] text-white flex items-center justify-center font-bold text-xs">
              ✓
            </span>
            <span className="font-medium">{savedMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedMessage("")}
            className="text-[#6555B6] hover:text-[#4E409D] font-semibold text-sm px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200/80 text-red-800 text-sm">
          <p className="font-semibold mb-1">Veuillez corriger les erreurs suivantes :</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-red-700">
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── SECTION 1: Informations Générales ── */}
      <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#8B7CD8]/15 text-[#6555B6] text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-semibold text-gray-900">Informations générales</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-9.5">
            Nom et description du vêtement affichés sur la fiche produit
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Nom du produit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Jupe Plissée Éléganza"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition ${
                errors.name ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les matières, la coupe, la longueur et les détails de confection…"
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition"
            />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Tarification ── */}
      <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#8B7CD8]/15 text-[#6555B6] text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-semibold text-gray-900">Prix & Tarifs</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-9.5">
            Définissez le prix standard et le prix promotionnel appliqué par défaut
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Prix de base <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-3.5 pr-14 py-2.5 text-sm bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition ${
                  errors.price ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
                DA
              </span>
            </div>
            {errors.price && <p className="text-xs text-red-600 mt-1.5">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Prix promotionnel (optionnel)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Ex: 3800"
                className="w-full pl-3.5 pr-14 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
                DA
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Laissez vide si le produit n'est pas en solde</p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Catégorisation ── */}
      <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#8B7CD8]/15 text-[#6555B6] text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-semibold text-gray-900">Catégorisation</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-9.5">
            Rayon de la boutique dans lequel apparaîtra ce produit
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full max-w-md px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ── SECTION 4: Photos du Produit ── */}
      <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#8B7CD8]/15 text-[#6555B6] text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="text-base font-semibold text-gray-900">Galerie de photos</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-9.5">
            Photos principales du produit présentées dans la galerie cliente
          </p>
        </div>

        <div>
          <ImageUploader images={images} onChange={setImages} folder="shop-products" />
        </div>
      </section>

      {/* ── SECTION 5: Options (Tailles & Couleurs avec HSL Shades) ── */}
      <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#8B7CD8]/15 text-[#6555B6] text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h2 className="text-base font-semibold text-gray-900">Options disponibles (Tailles & Couleurs)</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-9.5">
            Laissez vide pour un produit sans déclinaisons (taille & couleur uniques), ou ajoutez des options pour générer les variantes.
          </p>
        </div>

        {/* Tailles */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
            Tailles
          </label>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize(sizeInput);
                }
              }}
              placeholder="Ex: S, M, L, XL, 38, 40, TU..."
              className="flex-1 px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#8B7CD8] focus:ring-2 focus:ring-[#8B7CD8]/20 transition"
            />
            <button
              type="button"
              onClick={() => addSize(sizeInput)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] rounded-lg transition shadow-xs whitespace-nowrap"
            >
              + Ajouter
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {sizes.length === 0 ? (
              <span className="text-xs text-gray-400 italic">Aucune taille (Taille unique par défaut).</span>
            ) : (
              sizes.map((s) => (
                <div
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8B7CD8]/10 text-[#5B4CAE] border border-[#8B7CD8]/25 rounded-lg text-xs font-semibold"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSize(s)}
                    className="w-4 h-4 rounded-full hover:bg-[#8B7CD8]/20 flex items-center justify-center text-xs transition"
                    title="Supprimer la taille"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
            Couleurs (Sélecteur en français avec nuances HSL)
          </label>

          {/* Nouveau ColorPicker avec dictionnaire français et nuances HSL */}
          <ColorPicker
            label="Ajouter une couleur"
            onAdd={(colorName, hex) => addColor(colorName, hex)}
          />

          {/* Liste des couleurs configurées */}
          <div className="pt-2">
            <span className="text-xs text-gray-500 font-medium block mb-2">
              Couleurs sélectionnées ({colors.length}) :
            </span>
            <div className="flex flex-wrap gap-2.5">
              {colors.length === 0 ? (
                <span className="text-xs text-gray-400 italic">Aucune couleur (Couleur unique par défaut).</span>
              ) : (
                colors.map((c) => (
                  <div
                    key={c.name}
                    className="inline-flex items-center gap-2 pl-2 pr-2.5 py-1.5 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 shadow-2xs group hover:border-gray-300"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs flex-shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="capitalize">{c.name}</span>
                    <span className="text-[10px] font-mono text-gray-400">({c.hex})</span>
                    <button
                      type="button"
                      onClick={() => removeColor(c.name)}
                      className="text-gray-400 hover:text-red-600 font-bold ml-1 transition"
                      title="Supprimer la couleur"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: Variantes & Stocks ── */}
      <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#8B7CD8]/15 text-[#6555B6] text-xs font-bold flex items-center justify-center">
                6
              </span>
              <h2 className="text-base font-semibold text-gray-900">Variantes & Stock</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1 pl-9.5">
              Saisissez le stock et gérez les détails de chaque variante
            </p>
          </div>

          {variants.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-[#8B7CD8]/10 text-[#5B4CAE] font-medium border border-[#8B7CD8]/25">
                {variants.filter((v) => v.isActive).length} / {variants.length} actives
              </span>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium border border-gray-200">
                Stock total : {totalStockCount}
              </span>
            </div>
          )}
        </div>

        {variants.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
            <p className="text-sm font-medium text-gray-600">Aucune variante disponible</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200/80 shadow-2xs">
            <table className="min-w-full table-auto border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200/80 text-gray-600 uppercase font-semibold tracking-wider">
                  <th className="py-3 px-3.5 text-center">Active</th>
                  <th className="py-3 px-3">Photo</th>
                  <th className="py-3 px-3">Déclinaison</th>
                  <th className="py-3 px-3">Prix (DA)</th>
                  <th className="py-3 px-3">Prix Promo (DA)</th>
                  <th className="py-3 px-3">Quantité</th>
                  <th className="py-3 px-3">SKU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((v, i) => (
                  <tr
                    key={`${v.size}-${v.colorName}-${i}`}
                    className={`transition-colors even:bg-gray-50/40 hover:bg-[#8B7CD8]/5 ${
                      !v.isActive ? "opacity-60 bg-gray-50/70" : ""
                    }`}
                  >
                    {/* Status Toggle / Switch */}
                    <td className="py-3.5 px-3.5 text-center align-middle">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={v.isActive}
                        onClick={() => updateVariant(i, { isActive: !v.isActive })}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8B7CD8]/30 ${
                          v.isActive ? "bg-[#8B7CD8]" : "bg-gray-200"
                        }`}
                        title={v.isActive ? "Désactiver la variante" : "Activer la variante"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            v.isActive ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Photo de la variante */}
                    <td className="py-3 px-3 align-middle">
                      <div className="relative group w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {v.image ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v.image} alt="variant" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-white font-medium cursor-pointer">
                              Changer
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleVariantImage(i, f);
                                }}
                              />
                            </label>
                          </>
                        ) : (
                          <label className="cursor-pointer text-[10px] font-medium text-[#6555B6] hover:underline p-1 text-center">
                            + Photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleVariantImage(i, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </td>

                    {/* Nom déclinaison */}
                    <td className="py-3 px-3 align-middle">
                      <div className="font-semibold text-gray-900 text-sm">
                        {v.size === "Unique" && (v.colorName === "Standard" || v.colorName === "Unique") ? (
                          <span>Produit unique</span>
                        ) : (
                          <>
                            {v.size} — <span className="capitalize">{v.colorName}</span>
                          </>
                        )}
                      </div>
                      {v.colorName !== "Standard" && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 inline-block"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <span className="font-mono text-gray-400 text-[11px]">{v.colorHex}</span>
                        </div>
                      )}
                    </td>

                    {/* Prix spécifique */}
                    <td className="py-3 px-3 align-middle">
                      <input
                        type="number"
                        step="0.01"
                        value={v.price ?? ""}
                        onChange={(e) => updateVariant(i, { price: e.target.value })}
                        placeholder={price ? String(price) : "Hérité"}
                        className="w-24 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-[#8B7CD8] focus:ring-1 focus:ring-[#8B7CD8]"
                      />
                      {errors[`variant_${i}_price`] && (
                        <div className="text-[10px] text-red-600 mt-0.5">{errors[`variant_${i}_price`]}</div>
                      )}
                    </td>

                    {/* Prix promo spécifique */}
                    <td className="py-3 px-3 align-middle">
                      <input
                        type="number"
                        step="0.01"
                        value={v.reducedPrice ?? ""}
                        onChange={(e) => updateVariant(i, { reducedPrice: e.target.value })}
                        placeholder={salePrice ? String(salePrice) : "Optionnel"}
                        className="w-24 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-[#8B7CD8] focus:ring-1 focus:ring-[#8B7CD8]"
                      />
                    </td>

                    {/* Quantité */}
                    <td className="py-3 px-3 align-middle">
                      <input
                        type="number"
                        min="0"
                        value={v.quantity}
                        onChange={(e) => updateVariant(i, { quantity: Number(e.target.value) })}
                        className={`w-20 px-2.5 py-1.5 bg-white border rounded-lg text-gray-900 focus:outline-none focus:border-[#8B7CD8] focus:ring-1 focus:ring-[#8B7CD8] font-medium ${
                          Number(v.quantity) === 0 ? "border-amber-300 bg-amber-50/30 text-amber-900" : "border-gray-200"
                        }`}
                      />
                      {errors[`variant_${i}_quantity`] && (
                        <div className="text-[10px] text-red-600 mt-0.5">{errors[`variant_${i}_quantity`]}</div>
                      )}
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 align-middle">
                      <input
                        type="text"
                        value={v.sku ?? ""}
                        onChange={(e) => updateVariant(i, { sku: e.target.value })}
                        placeholder="Ex: JUP-BLK-S"
                        className="w-32 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono text-[11px] focus:outline-none focus:border-[#8B7CD8] focus:ring-1 focus:ring-[#8B7CD8]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── BARRE D'ACTIONS INFERIEURE ── */}
      <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8B7CD8] animate-pulse" />
          <span className="text-xs text-gray-600 font-medium">
            {isEdit ? "Modification en cours du produit" : "Création d'une nouvelle fiche produit"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#8B7CD8] hover:bg-[#7A6BC7] rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Enregistrement…</span>
              </>
            ) : (
              <span>Enregistrer le produit</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

