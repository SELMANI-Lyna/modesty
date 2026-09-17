"use client";

import { useCallback, useState } from "react";
import SearchBarClient from "./SearchBarClient";
import ShopCatalog from "./ShopCatalog";

export default function ProductsShell({ initialProducts, category, children }) {
  const [searchResults, setSearchResults] = useState(null);

  const handleResults = useCallback((results) => {
    setSearchResults(results);
  }, []);

  return (
    <div className="space-y-0">
      <div className="mb-4">
        <SearchBarClient category={category} onResults={handleResults} />
      </div>
      {children}
      <ShopCatalog
        initialProducts={initialProducts}
        category={category}
        hideSearch
        onExternalResults={searchResults}
      />
    </div>
  );
}
