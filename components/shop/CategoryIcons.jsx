const ICON = {
  className: "h-16 w-16 sm:h-20 sm:w-20",
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "#8B7CD8",
  strokeWidth: 2.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function CategoryIcon({ name }) {
  switch (name) {
    case "VESTE":
      return (
        <svg {...ICON} aria-hidden="true">
          <path d="M18 18l10-8h8l10 8 6 8v28H12V26l6-8z" />
          <path d="M22 14l10 14M42 14L32 28" />
          <path d="M32 28v26" />
          <circle cx="32" cy="36" r="1.4" fill="#8B7CD8" stroke="none" />
          <circle cx="32" cy="44" r="1.4" fill="#8B7CD8" stroke="none" />
        </svg>
      );
    case "ENSEMBLE":
      return (
        <svg {...ICON} aria-hidden="true">
          <path d="M22 10h20l5 8v8H17v-8l5-8z" />
          <path d="M32 10v16" />
          <path d="M20 30h24v6l-3 16H23l-3-16v-6z" />
          <path d="M32 36v16" />
        </svg>
      );
    case "ROBE":
      return (
        <svg {...ICON} aria-hidden="true">
          <path d="M26 8h12" />
          <path d="M28 8c0 4 8 4 8 0" />
          <path d="M28 12l-4 10-10 30h36L40 22l-4-10" />
          <path d="M24 22h16" />
        </svg>
      );
    case "JUPE":
      return (
        <svg {...ICON} aria-hidden="true">
          <path d="M22 14h20" />
          <path d="M24 14l-10 38h36L40 14" />
          <path d="M26 28h12" />
        </svg>
      );
    case "HIJAB":
      return (
        <svg {...ICON} aria-hidden="true">
          <path d="M20 28c1-12 6-20 12-20 8 0 14 8 14 18 0 6-2 12-6 16" />
          <path d="M20 28c-6 4-10 14-10 22h36c0-4-1-10-4-14" />
          <path d="M32 12c4 6 5 12 4 20" />
        </svg>
      );
    case "PANTALON":
      return (
        <svg {...ICON} aria-hidden="true">
          <path d="M22 10h20l2 8-8 36h-8L20 18l2-8z" />
          <path d="M32 18v36" />
          <path d="M24 10c2 4 12 4 16 0" />
        </svg>
      );
    default:
      return null;
  }
}
