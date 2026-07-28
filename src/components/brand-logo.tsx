/** Premium 3D isometric cube mark: shaded faces, gloss highlight, crisp edges. */
export function DevMatrixLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="dm-top" x1="8" y1="6" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.42" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="dm-left" x1="7" y1="15" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id="dm-right" x1="41" y1="15" x2="26" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.7" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.36" />
        </linearGradient>
        <linearGradient id="dm-gloss" x1="10" y1="8" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* faces */}
      <path d="M24 4 42 14v20L24 44 6 34V14L24 4Z" fill="url(#dm-left)" />
      <path d="M24 4 42 14 24 24 6 14 24 4Z" fill="url(#dm-top)" />
      <path d="M42 14v20L24 44V24l18-10Z" fill="url(#dm-right)" />

      {/* gloss sweep on the top face */}
      <path d="M24 4 42 14 24 24 6 14 24 4Z" fill="url(#dm-gloss)" />

      {/* isometric edges */}
      <g
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M24 4 42 14v20L24 44 6 34V14L24 4Z" />
        <path d="M6 14 24 24l18-10" opacity="0.85" />
        <path d="M24 24v20" opacity="0.85" />
      </g>

      {/* specular edge highlight */}
      <path
        d="M24 5.6 40.4 14.6"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="1.7" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color:var(--primary)]/15 bg-[color:var(--primary)]/[0.06] text-[color:var(--primary)]"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <DevMatrixLogo className="h-6 w-6" />
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
          Dev<span className="text-[color:var(--primary)]">Matrix</span>
        </span>
      )}
    </span>
  );
}
