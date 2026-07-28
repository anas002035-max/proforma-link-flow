import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";

type Burst = { id: number; x: number; y: number };

/**
 * Global "energetic square" transition: a geometric square pops open at the click
 * point on every button / nav link, and route content expands out of that square.
 */
export function SquareTransitions({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (reduced) return;
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest(
        "button, a[href], [role='button'], [role='switch'], input[type='submit']",
      );
      if (!target) return;
      const id = Date.now() + Math.random();
      setBursts((b) => [...b, { id, x: e.clientX, y: e.clientY }]);
      setOrigin({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
      window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 700);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduced]);

  return (
    <div className="relative min-w-0 flex-1">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={
            reduced
              ? false
              : { clipPath: `inset(46% 46% 46% 46% round 18px)`, opacity: 0.4, scale: 0.985 }
          }
          animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)", opacity: 1, scale: 1 }}
          transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: `${origin.x}% ${origin.y}%`, willChange: "clip-path, transform" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
        <AnimatePresence>
          {bursts.map((b) => (
            <motion.span
              key={b.id}
              className="absolute rounded-[14px] border-2 border-[color:var(--primary)]/45"
              style={{
                left: b.x,
                top: b.y,
                width: 40,
                height: 40,
                marginLeft: -20,
                marginTop: -20,
                background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                willChange: "transform, opacity",
              }}
              initial={{ scale: 0.2, opacity: 0.9, rotate: 0 }}
              animate={{ scale: 9, opacity: 0, rotate: 45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.12, 0.85, 0.2, 1] }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
