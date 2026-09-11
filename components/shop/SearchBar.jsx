"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function SearchBar({ initialQuery = "", category, onResults, onQueryChange }) {
  const t = useTranslations("common");
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      onQueryChange?.(query);
      const q = query.trim();
      if (!q) {
        onResults?.(null);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (category) params.set("category", category);
        const res = await fetch(`/api/products/search?${params.toString()}`);
        const data = await res.json();
        onResults?.(Array.isArray(data) ? data : []);
      } catch {
        onResults?.([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, category, onQueryChange, onResults]);

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search")}
        className="w-full rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10"
      />
      {loading && (
        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs text-neutral-400">{t("loading")}</span>
      )}
    </div>
  );
}
