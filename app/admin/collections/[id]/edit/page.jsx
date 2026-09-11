import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/app/lib/prisma";
import LogoutButton from "@/app/admin/LogoutButton";
import CollectionForm from "../../_components/CollectionForm";

export const dynamic = "force-dynamic";

export default async function EditCollectionPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const [collection, products] = await Promise.all([
    prisma.collection.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true, name: true, images: true },
        },
      },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        images: true,
      },
    }),
  ]);

  if (!collection) notFound();

  const serializedCollection = JSON.parse(JSON.stringify(collection));
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin/collections" className="text-xs text-gray-500 hover:text-gray-900 transition">
                ← Collections
              </Link>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-semibold text-gray-700">Edit Collection</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Collection</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <span className="text-xs text-gray-500 block">Logged in as</span>
              <span className="text-xs font-semibold text-gray-900 font-mono">{session.user?.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>

        <CollectionForm initialCollection={serializedCollection} products={serializedProducts} />
      </div>
    </div>
  );
}
