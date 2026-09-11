export function getProductUnitPrice(product, variant = null) {
  const promoActive = !!product?.isOnSale;
  if (variant) {
    if (promoActive && variant.reducedPrice != null) return variant.reducedPrice;
    if (!promoActive && variant.price != null) return variant.price;
  }
  if (promoActive && product?.salePrice != null) return product.salePrice;
  return product?.price ?? 0;
}

export function getDisplayPrices(product) {
  const original = product?.price ?? 0;
  const promoActive = !!product?.isOnSale && product?.salePrice != null;
  return {
    original,
    current: promoActive ? product.salePrice : original,
    promoActive,
  };
}

export function formatPrice(amount, locale = "fr") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Math.round(Number(amount) || 0)) + " DA";
}
