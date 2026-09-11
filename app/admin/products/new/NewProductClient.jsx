"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/app/admin/products/_components/ProductForm";

export default function NewProductClient() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create product</h1>
      <ProductForm onSaved={(id) => { if (id) router.push(`/admin/products/${id}/edit`); }} />
    </div>
  );
}
