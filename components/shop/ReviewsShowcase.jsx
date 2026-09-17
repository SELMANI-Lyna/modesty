import { getTranslations } from "next-intl/server";

function QuoteMark() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 40 32" fill="#8B7CD8" aria-hidden="true">
      <path d="M6 32c4.2 0 7.6-3.4 7.6-7.6S10.2 16.8 6 16.8V12c8.8 0 15.6 6.6 15.6 16.4V32H6zm18.4 0c4.2 0 7.6-3.4 7.6-7.6s-3.4-7.6-7.6-7.6V12c8.8 0 15.6 6.6 15.6 16.4V32H24.4z" />
    </svg>
  );
}

export default async function ReviewsShowcase({ feedbacks = [] }) {
  const t = await getTranslations("home");
  if (!feedbacks.length) return null;

  const items = feedbacks.slice(0, 3);

  return (
    <section className="-mx-4 rounded-[2rem] bg-[#faf8f6] px-4 py-12 sm:mx-0 sm:px-6 sm:py-16">
      <div className="mb-10 text-center">
        <span className="inline-block rounded-full bg-[#EDE9F9] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#8B7CD8]">
          {t("reviewsTitle")}
        </span>
        <h2 className="mt-4 text-2xl font-semibold text-[#8B7CD8] sm:text-3xl">
          {t("reviewsHeading")}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const avatar = item.photos?.[0];
          const initial = (item.clientName || "?").replace(/^@/, "").charAt(0).toUpperCase();
          return (
            <article
              key={item.id}
              className="flex min-h-[220px] flex-col rounded-[1.6rem] bg-[#EDE9F9] p-6"
            >
              <QuoteMark />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[#4c3f8a] whitespace-pre-wrap">
                {item.message}
              </p>
              {item.rating ? (
                <p className="mt-3 text-sm text-[#8B7CD8]">{"★".repeat(item.rating)}</p>
              ) : null}
              <div className="mt-5 flex items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B7CD8] text-sm font-semibold text-white">
                    {initial}
                  </span>
                )}
                <p className="text-sm font-medium text-[#6555B6]">{item.clientName}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
