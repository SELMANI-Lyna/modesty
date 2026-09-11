import { getTranslations } from "next-intl/server";
import Link from "next/link";
import prisma from "@/app/lib/prisma";
import { getProductsSortedByOrders, getPromoProducts } from "@/lib/products";
import ProductCard from "@/components/shop/ProductCard";
import PromoStrip from "@/components/shop/PromoStrip";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const [promos, best, feedbacks] = await Promise.all([
    getPromoProducts(),
    getProductsSortedByOrders({ take: 8 }),
    prisma.feedback.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const photos = feedbacks.flatMap((item) =>
    (item.photos || []).map((photo) => ({
      photo,
      storyLink: item.storyLink,
      id: `${item.id}-${photo}`,
    }))
  );

  return (
    <div className="space-y-14">
      <section className="rounded-3xl bg-white border border-neutral-200 px-6 py-12 text-center sm:px-12">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t("heroSubtitle")}</p>
        <Link
          href="/produits"
          className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
        >
          {t("shopCta")}
        </Link>
      </section>

      <PromoStrip products={JSON.parse(JSON.stringify(promos))} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("bestTitle")}</h2>
          <Link href="/produits" className="text-sm text-neutral-500">
            {common("viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {best.map((product) => (
            <ProductCard key={product.id} product={JSON.parse(JSON.stringify(product))} />
          ))}
        </div>
      </section>

      {feedbacks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("reviewsTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {feedbacks.map((item) => (
              <article key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-neutral-900">{item.clientName}</p>
                  {item.rating ? (
                    <p className="text-amber-500 text-sm">{"★".repeat(item.rating)}{"☆".repeat(Math.max(0, 5 - item.rating))}</p>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap">{item.message}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {photos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("photosTitle")}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {photos.map((item) =>
              item.storyLink ? (
                <a
                  key={item.id}
                  href={item.storyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-xl"
                >
                  <img src={item.photo} alt="" className="h-full w-full object-cover" />
                </a>
              ) : (
                <div key={item.id} className="aspect-square overflow-hidden rounded-xl">
                  <img src={item.photo} alt="" className="h-full w-full object-cover" />
                </div>
              )
            )}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold">{t("guideTitle")}</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((step) => (
            <li key={step} className="rounded-2xl bg-[#faf8f6] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">0{step}</p>
              <h3 className="mt-1 font-medium">{t(`guide${step}Title`)}</h3>
              <p className="mt-1 text-sm text-neutral-600">{t(`guide${step}Text`)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
