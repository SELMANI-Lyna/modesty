import { notFound } from "next/navigation";
import prisma from "@/app/lib/prisma";
import ProductCard from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({ params }) {
  const { id } = await params;
  const collection = await prisma.collection.findFirst({
    where: { id, status: "in_store" },
    include: {
      products: {
        include: {
          colors: { select: { id: true, name: true, hex: true } },
          variants: {
            select: {
              id: true,
              size: true,
              colorName: true,
              colorHex: true,
              quantity: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!collection) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{collection.name}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {collection.products.map((product) => (
          <ProductCard key={product.id} product={JSON.parse(JSON.stringify(product))} />
        ))}
      </div>
    </div>
  );
}
