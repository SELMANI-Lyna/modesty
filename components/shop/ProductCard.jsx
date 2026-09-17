"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatPrice, getDisplayPrices } from "@/lib/pricing";

export default function ProductCard({ product }) {
  const t = useTranslations();
  const { original, current, promoActive } = getDisplayPrices(product);
  const image = product.images?.[0];
  const colors = product.colors?.length
    ? product.colors
    : (product.variants || []).reduce((acc, v) => {
        if (!acc.some((c) => c.hex === v.colorHex)) {
          acc.push({ name: v.colorName, hex: v.colorHex });
        }
        return acc;
      }, []);
  const soldOut = !(product.variants || []).some((v) => v.isActive && v.quantity > 0);
  const discountPercent =
    product.isOnSale && product.salePrice != null && Number(product.price) > 0
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;
  const showDiscount = discountPercent > 0;

  return (
    <Link href={`/produits/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400 text-sm">—</div>
        )}
        {showDiscount && (
          <span className="absolute top-3 start-3 rounded-full bg-[#8B7CD8] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
            {t("common.discount", { percent: discountPercent })}
          </span>
        )}
        {promoActive && !showDiscount && (
          <span className="absolute top-3 start-3 rounded-full bg-[#8B7CD8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            {t("nav.promotions")}
          </span>
        )}
        {soldOut && (
          <span className="absolute bottom-3 start-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-red-700">
            {t("common.soldOut")}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-neutral-900 line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-neutral-900">{formatPrice(current)}</span>
          {promoActive && <span className="text-neutral-400 line-through">{formatPrice(original)}</span>}
        </div>
        {colors.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            {colors.slice(0, 5).map((color) => (
              <span
                key={color.id || color.hex}
                title={color.name}
                className="h-3.5 w-3.5 rounded-full border border-neutral-200"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
