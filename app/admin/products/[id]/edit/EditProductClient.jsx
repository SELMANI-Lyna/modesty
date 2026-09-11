"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/app/admin/products/_components/ProductForm";

export default function EditProductClient({ initial }) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Edit product</h1>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition"
        >
          ← Back to products
        </button>
      </div>
      <ProductForm initial={initial} onSaved={() => router.refresh()} />
    </div>
  );
}
