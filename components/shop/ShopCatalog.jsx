"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import SearchBar from "./SearchBar";
import ProductCard from "./ProductCard";

const CATEGORIES = ["JUPE", "ENSEMBLE", "ROBE", "HIJAB", "PANTALON", "VESTE"];

export default function ShopCatalog({ initialProducts, category, hideSearch = false, onExternalResults }) {
  const t = useTranslations();
  const router = useRouter();
  const [internalResults, setInternalResults] = useState(null);

  // Accept results either from internal SearchBar or from an external one via prop
  const searchResults = onExternalResults !== undefined ? onExternalResults : internalResults;

  const onResults = useCallback((results) => {
    setInternalResults(results);
  }, []);

  const products = useMemo(() => {
    const source = searchResults ?? initialProducts;
    if (!category) return source;
    return source.filter((p) => p.category === category);
  }, [searchResults, initialProducts, category]);

  return (
    <div className="space-y-6">
      {/* SearchBar — hidden when managed externally by the parent page */}
      {!hideSearch && <SearchBar category={category} onResults={onResults} />}

      {/* Category filter pills — compact, the homepage already has the main category nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => router.push("/produits")}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${!category ? "bg-[#8B7CD8] text-white shadow-xs" : "bg-white border border-neutral-200 text-neutral-500 hover:border-[#8B7CD8]/50"}`}
        >
          {t("categories.all")}
        </button>
        {CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => router.push(`/produits?category=${key}`)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
              category === key ? "bg-[#8B7CD8] text-white shadow-xs" : "bg-white border border-neutral-200 text-neutral-500 hover:border-[#8B7CD8]/50"
            }`}
          >
            {t(`categories.${key}`)}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">{t("common.noResults")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
