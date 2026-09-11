import Link from "next/link";
import { getTranslations } from "next-intl/server";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const t = await getTranslations("collections");
  const collections = await prisma.collection.findMany({
    where: { status: "in_store" },
    orderBy: { createdAt: "desc" },
    include: {
      products: { select: { id: true, name: true, images: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {collections.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {collections.map((collection) => {
            const cover = collection.image || collection.products?.[0]?.images?.[0];
            return (
              <Link key={collection.id} href={`/collections/${collection.id}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100">
                  {cover ? (
                    <img src={cover} alt={collection.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-400">—</div>
                  )}
                </div>
                <h2 className="mt-3 font-medium">{collection.name}</h2>
                <p className="text-xs text-neutral-500">
                  {collection.products.length} {t("products")}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
