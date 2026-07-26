import { useCallback, useEffect, useState } from "react";

const KEY = "proforma:dev-pro";
const EVENT = "proforma:dev-pro-change";

export function readDevPro() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Local-only Pro override for testing paywalled tools. */
export function useDevPro() {
  const [devPro, setDevPro] = useState(false);

  useEffect(() => {
    setDevPro(readDevPro());
    const sync = () => setDevPro(readDevPro());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleDevPro = useCallback((next?: boolean) => {
    const value = next ?? !readDevPro();
    try {
      if (value) window.localStorage.setItem(KEY, "1");
      else window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
    return value;
  }, []);

  return { devPro, toggleDevPro };
}
