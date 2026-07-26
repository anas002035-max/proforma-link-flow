import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QRPreview({ value, fg, bg, size = 240 }: { value: string; fg: string; bg: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value || " ", {
      width: size, margin: 2, color: { dark: fg, light: bg },
      errorCorrectionLevel: "M",
    }).catch(() => {});
  }, [value, fg, bg, size]);

  function download() {
    const c = ref.current; if (!c) return;
    const a = document.createElement("a");
    a.download = "qr.png"; a.href = c.toDataURL("image/png"); a.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl p-4" style={{ background: bg, boxShadow: "var(--shadow-soft)" }}>
        <canvas ref={ref} />
      </div>
      <button onClick={download} className="rounded-lg border border-input bg-surface px-3 py-1.5 text-xs hover:bg-surface-2">Download PNG</button>
    </div>
  );
}
