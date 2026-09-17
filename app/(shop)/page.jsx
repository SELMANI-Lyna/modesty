import { getTranslations } from "next-intl/server";
import Link from "next/link";
import prisma from "@/app/lib/prisma";
import { getProductsSortedByOrders, getPromoProducts } from "@/lib/products";
import ProductCard from "@/components/shop/ProductCard";
import PromoStrip from "@/components/shop/PromoStrip";
import CategoryNav from "@/components/shop/CategoryNav";
import ReviewsShowcase from "@/components/shop/ReviewsShowcase";
import TrustHighlights from "@/components/shop/TrustHighlights";

export const dynamic = "force-dynamic";

// ─── Hero citation options (change `active` index to switch) ───────────────────
const CITATIONS = [
  // Option 1 (active)
  { ar: "الحشمة أناقة لا تحتاج إلى تفسير", fr: "La pudeur est une élégance qui n'a pas besoin de s'expliquer" },
  // Option 2
  { ar: "ترتدين الثقة قبل اللباس", fr: "Tu revêts la confiance avant le vêtement" },
  // Option 3
  { ar: "جمالك لك وحدك", fr: "Ta beauté t'appartient" },
];
const ACTIVE_CITATION = CITATIONS[0];

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

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto flex w-full max-w-[95%] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] bg-[#F0F0F0] px-4 py-12 text-center shadow-sm sm:max-w-[90%] sm:px-8 sm:py-16 md:py-20">
        {/* Arabic citation */}
        <p
          className="mb-4 text-sm font-medium italic tracking-wide sm:text-base md:text-lg"
          style={{ color: "#8B7CD8" }}
          dir="rtl"
          lang="ar"
        >
          {ACTIVE_CITATION.ar}
        </p>

        {/* Full Logo & Artwork - Shown Completely Without Any Cropping */}
        <div className="relative my-2 w-full max-w-xs sm:max-w-md md:max-w-lg">
          <img
            src="/hero-banner.png"
            alt="Hajoubi Boutique Muslimah"
            className="mx-auto h-auto max-h-[360px] w-full object-contain sm:max-h-[440px] md:max-h-[520px]"
          />
        </div>

        <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-600 sm:text-base">
          {t("heroSubtitle")}
        </p>

        <Link
          href="/produits"
          className="mt-6 inline-flex rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:opacity-95 sm:text-base"
          style={{ backgroundColor: "#8B7CD8" }}
        >
          {t("shopCta")}
        </Link>
      </section>

      {/* ── PROMO STRIP ──────────────────────────────────────────────────────── */}
      <PromoStrip products={JSON.parse(JSON.stringify(promos))} />

      {/* ── BEST SELLERS ─────────────────────────────────────────────────────── */}
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

      <CategoryNav />

      <ReviewsShowcase feedbacks={JSON.parse(JSON.stringify(feedbacks))} />

      {/* ── CUSTOMER PHOTOS ───────────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <section className="rounded-[2rem] bg-[#faf8f6] px-4 py-10 sm:px-6 sm:py-12">
          <div className="mb-8 text-center">
            <span className="inline-block rounded-full bg-[#EDE9F9] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#8B7CD8]">
              Instagram
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-[#8B7CD8] sm:text-3xl">
              {t("photosTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {photos.map((item) =>
              item.storyLink ? (
                <a
                  key={item.id}
                  href={item.storyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group aspect-square overflow-hidden rounded-2xl bg-[#EDE9F9] p-1 shadow-sm transition-transform duration-200 hover:scale-105"
                >
                  <img src={item.photo} alt="" className="h-full w-full rounded-xl object-cover" />
                </a>
              ) : (
                <div key={item.id} className="aspect-square overflow-hidden rounded-2xl bg-[#EDE9F9] p-1 shadow-sm">
                  <img src={item.photo} alt="" className="h-full w-full rounded-xl object-cover" />
                </div>
              )
            )}
          </div>
        </section>
      )}

      <TrustHighlights />

      {/* ── HOW TO ORDER ─────────────────────────────────────────────────────── */}
      <section className="rounded-[2rem] bg-[#faf8f6] px-4 py-10 sm:px-8 sm:py-12">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-[#EDE9F9] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#8B7CD8]">
            Guide
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-[#8B7CD8] sm:text-3xl">
            {t("guideTitle")}
          </h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((step) => (
            <li key={step} className="flex flex-col rounded-2xl bg-[#EDE9F9] p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B7CD8]">0{step}</span>
              <h3 className="mt-2 font-semibold text-[#4c3f8a]">{t(`guide${step}Title`)}</h3>
              <p className="mt-1 text-sm text-[#6555B6]">{t(`guide${step}Text`)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
