"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import SearchBar from "./SearchBar";
import ProductCard from "./ProductCard";

const CATEGORIES = ["JUPE", "ENSEMBLE", "ROBE", "HIJAB", "PANTALON", "VESTE"];

export default function ShopCatalog({ initialProducts, category }) {
  const t = useTranslations();
  const router = useRouter();
  const [searchResults, setSearchResults] = useState(null);

  const onResults = useCallback((results) => {
    setSearchResults(results);
  }, []);

  const products = useMemo(() => {
    const source = searchResults ?? initialProducts;
    if (!category) return source;
    return source.filter((p) => p.category === category);
  }, [searchResults, initialProducts, category]);

  return (
    <div className="space-y-6">
      <SearchBar category={category} onResults={onResults} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => router.push("/produits")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${!category ? "bg-black text-white" : "bg-white border border-neutral-200"}`}
        >
          {t("categories.all")}
        </button>
        {CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => router.push(`/produits?category=${key}`)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
              category === key ? "bg-black text-white" : "bg-white border border-neutral-200"
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
