/**
 * Original decorative bits for the pink theme (bow, heart, sparkle).
 * These are simple shapes drawn for this project, not a licensed character.
 */

export function Bow({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M32 32 C22 14 6 14 6 28 C6 42 22 46 32 32 Z"
        fill="#ff8fb8"
        stroke="#e0508a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 32 C42 14 58 14 58 28 C58 42 42 46 32 32 Z"
        fill="#ff8fb8"
        stroke="#e0508a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M32 32 L20 54 L28 50 L32 58 L36 50 L44 54 Z" fill="#ffb3d1" stroke="#e0508a" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="6" fill="#ffd1e3" stroke="#e0508a" strokeWidth="2.5" />
    </svg>
  );
}

export function Heart({ size = 16, color = "#ff6fa5" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.5 6.7 4.5c2 0 3.5 1 5.3 3 1.8-2 3.3-3 5.3-3 3.7 0 5.8 3.8 4.3 7.3C19.5 16.4 12 21 12 21z"
        fill={color}
      />
    </svg>
  );
}

export function Sparkle({ size = 14, color = "#ffc2dc" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill={color} />
    </svg>
  );
}

/** Soft floating hearts and sparkles behind the page. */
export function FloatingBackdrop() {
  const items = [
    { t: "10%", l: "8%", d: "0s", k: "heart" },
    { t: "22%", l: "86%", d: "1.2s", k: "sparkle" },
    { t: "48%", l: "5%", d: "2.4s", k: "sparkle" },
    { t: "62%", l: "90%", d: "0.6s", k: "heart" },
    { t: "82%", l: "14%", d: "1.8s", k: "heart" },
    { t: "90%", l: "78%", d: "3s", k: "sparkle" },
  ];
  return (
    <div className="backdrop" aria-hidden="true">
      {items.map((it, i) => (
        <span
          key={i}
          className="float"
          style={{ top: it.t, left: it.l, animationDelay: it.d }}
        >
          {it.k === "heart" ? <Heart size={18} color="#ffc2dc" /> : <Sparkle size={16} />}
        </span>
      ))}
    </div>
  );
}
