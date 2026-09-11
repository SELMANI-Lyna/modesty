import prisma from "@/app/lib/prisma";
import EditProductClient from "./EditProductClient";

export default async function Page({ params }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { colors: true, variants: true },
  });

  if (!product) {
    return <div className="p-6">Product not found</div>;
  }

  return (
    <div className="p-6">
      {/* Pass the product as initial to the client wrapper */}
      <EditProductClient initial={product} />
    </div>
  );
}
