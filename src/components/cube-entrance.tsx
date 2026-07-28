import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Phase = "rolling" | "unfolding" | "revealed";

const S = 116; // cube edge in px
const H = S / 2;

const FACES: { t: string; tint: string }[] = [
  { t: `translateZ(${H}px)`, tint: "0.10" },
  { t: `rotateY(180deg) translateZ(${H}px)`, tint: "0.14" },
  { t: `rotateY(90deg) translateZ(${H}px)`, tint: "0.16" },
  { t: `rotateY(-90deg) translateZ(${H}px)`, tint: "0.16" },
  { t: `rotateX(90deg) translateZ(${H}px)`, tint: "0.07" },
  { t: `rotateX(-90deg) translateZ(${H}px)`, tint: "0.2" },
];

/** Cinematic entrance: a 3D cube rolls in, stops, then unfolds flat to reveal its content. */
export function CubeEntrance({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? "revealed" : "rolling");

  useEffect(() => {
    if (reduced) setPhase("revealed");
  }, [reduced]);

  useEffect(() => {
    if (phase !== "unfolding") return;
    const id = window.setTimeout(() => setPhase("revealed"), 780);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <div className="relative flex min-h-[68vh] w-full items-center justify-center [perspective:1400px]">
      {/* floor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in oklab, var(--primary) 5%, transparent))",
          maskImage: "linear-gradient(180deg, transparent, #000 60%)",
        }}
      />

      {phase === "rolling" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative"
            style={{ width: S, height: S, transformStyle: "preserve-3d", willChange: "transform" }}
            initial={{ x: "-42vw", rotateZ: -10, rotateY: -18 }}
            animate={{ x: 0, rotateZ: 540, rotateY: 0 }}
            transition={{ duration: 2.1, ease: [0.16, 0.9, 0.2, 1] }}
            onAnimationComplete={() => setPhase("unfolding")}
          >
            {FACES.map((f, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-[14px] border border-[color:var(--primary)]/35"
                style={{
                  transform: f.t,
                  background: `color-mix(in oklab, var(--primary) ${Number(f.tint) * 100}%, white)`,
                  boxShadow: "inset 0 0 22px color-mix(in oklab, var(--primary) 18%, transparent)",
                  backfaceVisibility: "hidden",
                }}
              />
            ))}
          </motion.div>

          {/* rolling contact shadow */}
          <motion.div
            aria-hidden
            className="absolute bottom-[calc(50%-84px)] h-3 rounded-full blur-md"
            style={{ width: S, background: "color-mix(in oklab, var(--primary) 26%, transparent)" }}
            initial={{ x: "-42vw", opacity: 0.15, scaleX: 0.6 }}
            animate={{ x: 0, opacity: 0.35, scaleX: 1 }}
            transition={{ duration: 2.1, ease: [0.16, 0.9, 0.2, 1] }}
          />
        </div>
      )}

      {phase !== "rolling" && (
        <motion.div
          className="relative w-full max-w-[400px] px-1"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* unfolding flaps */}
          {!reduced &&
            (
              [
                { origin: "bottom center", axis: "rotateX", sign: -1, cls: "inset-x-6 bottom-full h-16 mb-[-1px]", delay: 0 },
                { origin: "top center", axis: "rotateX", sign: 1, cls: "inset-x-6 top-full h-16 mt-[-1px]", delay: 0.09 },
                { origin: "right center", axis: "rotateY", sign: 1, cls: "inset-y-6 right-full w-14 mr-[-1px]", delay: 0.18 },
                { origin: "left center", axis: "rotateY", sign: -1, cls: "inset-y-6 left-full w-14 ml-[-1px]", delay: 0.27 },
              ] as const
            ).map((flap, i) => (
              <motion.div
                key={i}
                aria-hidden
                className={`pointer-events-none absolute rounded-[14px] border border-[color:var(--primary)]/25 ${flap.cls}`}
                style={{
                  transformOrigin: flap.origin,
                  background: "color-mix(in oklab, var(--primary) 8%, white)",
                  willChange: "transform",
                }}
                initial={{ [flap.axis]: flap.sign * 92, opacity: 0.9 }}
                animate={{ [flap.axis]: 0, opacity: 0.16 }}
                transition={{ duration: 0.62, delay: flap.delay, ease: [0.22, 1, 0.28, 1] }}
              />
            ))}

          {/* the flattened cube body → card */}
          <motion.div
            className="glass relative z-10 overflow-hidden p-7"
            initial={reduced ? false : { scaleX: 0.29, scaleY: 0.29, rotateX: 26, opacity: 0.9 }}
            animate={{ scaleX: 1, scaleY: 1, rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: "transform" }}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: phase === "revealed" ? 1 : 0, y: phase === "revealed" ? 0 : 10 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
