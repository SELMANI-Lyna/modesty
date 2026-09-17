import prisma from "@/app/lib/prisma";
import EditProductClient from "./EditProductClient";

export default async function Page({ params }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { colors: true, variants: true },
  });

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 text-gray-500 text-sm">
        Produit introuvable
      </div>
    );
  }

  return <EditProductClient initial={product} />;
}

