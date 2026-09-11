"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatPrice, getDisplayPrices, getProductUnitPrice } from "@/lib/pricing";
import OrderForm from "./OrderForm";

export default function ProductDetails({ product }) {
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const images = product.images?.length ? product.images : [];
  const [activeImage, setActiveImage] = useState(images[0] || "");
  const variants = (product.variants || []).filter((v) => v.isActive);
  const colors = useMemo(() => {
    const list = [];
    for (const v of variants) {
      if (!list.some((c) => c.name === v.colorName)) {
        list.push({ name: v.colorName, hex: v.colorHex });
      }
    }
    return list;
  }, [variants]);
  const sizes = useMemo(() => {
    const list = [];
    for (const v of variants) {
      if (!list.includes(v.size)) list.push(v.size);
    }
    return list;
  }, [variants]);

  const [color, setColor] = useState(colors[0]?.name || "");
  const [size, setSize] = useState("");

  const selectedVariant = variants.find((v) => v.colorName === color && v.size === size) || null;

  const variantAvailable = (c, s) => {
    const v = variants.find((item) => item.colorName === c && item.size === s);
    return v && v.quantity > 0;
  };

  const display = getDisplayPrices(product);
  const current = selectedVariant ? getProductUnitPrice(product, selectedVariant) : display.current;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-neutral-100">
          {activeImage ? (
            <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">—</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImage(src)}
                className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border ${activeImage === src ? "border-black" : "border-neutral-200"}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xl font-semibold">{formatPrice(current)}</span>
          {display.promoActive && <span className="text-neutral-400 line-through">{formatPrice(display.original)}</span>}
        </div>
        {product.description && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-neutral-700">{t("description")}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{product.description}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">{t("color")}</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setColor(c.name);
                    const v = variants.find((item) => item.colorName === c.name && item.image);
                    if (v?.image) setActiveImage(v.image);
                  }}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${color === c.name ? "border-black" : "border-neutral-200"}`}
                >
                  <span className="h-4 w-4 rounded-full border border-neutral-200" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{t("size")}</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const ok = variantAvailable(color, s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!ok}
                    onClick={() => setSize(s)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      size === s ? "border-black bg-black text-white" : "border-neutral-200"
                    } ${!ok ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                  >
                    {ok ? s : `${s} · ${tc("soldOut")}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <OrderForm product={product} selectedVariant={selectedVariant} />
      </div>
    </div>
  );
}
