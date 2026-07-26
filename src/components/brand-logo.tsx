export function DevMatrixLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {/* top face */}
        <path d="M24 5 41 14.5 24 24 7 14.5 24 5Z" />
        {/* left face */}
        <path d="M7 14.5v19L24 43V24" />
        {/* right face */}
        <path d="M41 14.5v19L24 43" />
        {/* inner structure */}
        <path d="M24 5v19" opacity="0.35" />
        <path d="M7 14.5 41 33.5" opacity="0.18" />
        <path d="M41 14.5 7 33.5" opacity="0.18" />
      </g>
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color:var(--primary)]/15 bg-[color:var(--primary)]/[0.06] text-[color:var(--primary)]">
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
