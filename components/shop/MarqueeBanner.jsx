const MESSAGE =
  "تخفيضات حصرية ✦ PROMOTIONS EXCLUSIVES ✦ توصيل لكل ولايات الجزائر ✦ LIVRAISON PARTOUT EN ALGÉRIE ✦";

export default function MarqueeBanner() {
  const track = `${MESSAGE}  ${MESSAGE}`;

  return (
    <div
      className="overflow-hidden w-full"
      style={{ backgroundColor: "#8B7CD8" }}
      aria-hidden="true"
    >
      <div className="animate-marquee py-2.5 whitespace-nowrap">
        <span className="inline-block px-4 text-xs font-semibold tracking-widest uppercase text-white">
          {track}
        </span>
        <span className="inline-block px-4 text-xs font-semibold tracking-widest uppercase text-white">
          {track}
        </span>
      </div>
    </div>
  );
}
