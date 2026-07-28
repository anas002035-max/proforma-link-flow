import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";

type Burst = { id: number; x: number; y: number };

const C = 92; // transition cube edge
const CH = C / 2;

const FACES: { t: string; bg: string }[] = [
  { t: `translateZ(${CH}px)`, bg: "linear-gradient(150deg, color-mix(in oklab, var(--primary) 26%, white), color-mix(in oklab, var(--primary) 10%, white))" },
  { t: `rotateY(180deg) translateZ(${CH}px)`, bg: "linear-gradient(150deg, color-mix(in oklab, var(--primary) 34%, white), color-mix(in oklab, var(--primary) 16%, white))" },
  { t: `rotateY(90deg) translateZ(${CH}px)`, bg: "linear-gradient(120deg, color-mix(in oklab, var(--primary) 40%, white), color-mix(in oklab, var(--primary) 18%, white))" },
  { t: `rotateY(-90deg) translateZ(${CH}px)`, bg: "linear-gradient(120deg, color-mix(in oklab, var(--primary) 18%, white), color-mix(in oklab, var(--primary) 40%, white))" },
  { t: `rotateX(90deg) translateZ(${CH}px)`, bg: "linear-gradient(180deg, white, color-mix(in oklab, var(--primary) 12%, white))" },
  { t: `rotateX(-90deg) translateZ(${CH}px)`, bg: "linear-gradient(180deg, color-mix(in oklab, var(--primary) 46%, white), color-mix(in oklab, var(--primary) 28%, white))" },
];

/**
 * Global cube transition: on every route change a shaded 3D cube spins in the
 * center of the workspace and then expands outward with a swoosh, revealing the
 * new page content. Clicks on buttons/links also pop a small geometric square.
 */
export function SquareTransitions({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [spinning, setSpinning] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (reduced) return;
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest(
        "button, a[href], [role='button'], [role='switch'], input[type='submit']",
      );
      if (!target) return;
      const id = Date.now() + Math.random();
      setBursts((b) => [...b, { id, x: e.clientX, y: e.clientY }]);
      window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 620);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setSpinning(true);
    const id = window.setTimeout(() => setSpinning(false), 720);
    return () => window.clearTimeout(id);
  }, [pathname, reduced]);

  return (
    <div className="relative min-w-0 flex-1">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={reduced ? false : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: reduced ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* spinning cube → expanding swoosh */}
      <AnimatePresence>
        {spinning && (
          <div
            className="pointer-events-none absolute inset-0 z-50 grid place-items-center overflow-hidden"
            style={{ perspective: "1000px" }}
          >
            {/* swoosh shockwave */}
            <motion.span
              aria-hidden
              className="absolute rounded-[22px] border-2 border-[color:var(--primary)]/40"
              style={{
                width: C,
                height: C,
                background: "color-mix(in oklab, var(--primary) 8%, transparent)",
              }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [0.6, 1, 26], opacity: [0, 0.55, 0], rotate: [0, 12, 45] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, times: [0, 0.42, 1], ease: [0.12, 0.85, 0.2, 1] }}
            />

            <motion.div
              className="relative"
              style={{ width: C, height: C, transformStyle: "preserve-3d", willChange: "transform" }}
              initial={{ rotateX: -20, rotateY: 0, scale: 0.4, opacity: 0 }}
              animate={{ rotateX: [-20, 200, 420], rotateY: [0, 320, 720], scale: [0.4, 1, 9], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.72, times: [0, 0.45, 1], ease: [0.2, 0.8, 0.2, 1] }}
            >
              {FACES.map((f, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-[16px] border border-[color:var(--primary)]/35"
                  style={{
                    transform: f.t,
                    background: f.bg,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 0 22px color-mix(in oklab, var(--primary) 18%, transparent)",
                    backfaceVisibility: "hidden",
                  }}
                />
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* click pop */}
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
        <AnimatePresence>
          {bursts.map((b) => (
            <motion.span
              key={b.id}
              className="absolute rounded-[12px] border-2 border-[color:var(--primary)]/45"
              style={{
                left: b.x,
                top: b.y,
                width: 36,
                height: 36,
                marginLeft: -18,
                marginTop: -18,
                background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                willChange: "transform, opacity",
              }}
              initial={{ scale: 0.2, opacity: 0.9, rotate: 0 }}
              animate={{ scale: 7, opacity: 0, rotate: 45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.12, 0.85, 0.2, 1] }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
