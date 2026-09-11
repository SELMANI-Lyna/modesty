import { notFound } from "next/navigation";
import { getProductById } from "@/lib/products";
import ProductDetails from "@/components/shop/ProductDetails";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return <ProductDetails product={JSON.parse(JSON.stringify(product))} />;
}
