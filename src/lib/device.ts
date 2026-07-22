export type DeviceInfo = { device_type: "mobile" | "tablet" | "desktop"; os: string };

export function parseUA(ua: string): DeviceInfo {
  const u = ua.toLowerCase();
  let os = "Unknown";
  if (u.includes("android")) os = "Android";
  else if (u.includes("iphone") || u.includes("ipad") || u.includes("ipod")) os = "iOS";
  else if (u.includes("mac os")) os = "macOS";
  else if (u.includes("windows")) os = "Windows";
  else if (u.includes("linux")) os = "Linux";

  let device_type: DeviceInfo["device_type"] = "desktop";
  if (u.includes("ipad") || (u.includes("android") && !u.includes("mobile"))) device_type = "tablet";
  else if (u.includes("mobile") || u.includes("iphone") || u.includes("android")) device_type = "mobile";

  return { device_type, os };
}

// Try to synthesize a deep-link intent for known hosts. Returns null if none.
export function deepLinkFor(url: string, os: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (os !== "Android" && os !== "iOS") return null;
    if (host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.replace(/^\//, "");
      if (id) return `vnd.youtube://${id}`;
    }
    if (host === "instagram.com") {
      const path = u.pathname.replace(/^\//, "").replace(/\/$/, "");
      return `instagram://user?username=${path.split("/")[0]}`;
    }
    if (host === "twitter.com" || host === "x.com") {
      const user = u.pathname.replace(/^\//, "").split("/")[0];
      if (user) return `twitter://user?screen_name=${user}`;
    }
    if (host.endsWith("amazon.com") || host.endsWith("amazon.sa") || host.endsWith("amazon.ae")) {
      return `com.amazon.mobile.shopping://${u.host}${u.pathname}${u.search}`;
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      return `snssdk1233://${u.pathname}`;
    }
  } catch { /* ignore */ }
  return null;
}
