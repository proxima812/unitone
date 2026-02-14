import type { EditorLinkMeta } from "@/lib/types";

export const ARTICLE_LINK_CLASS = "flex gap-1 items-center underline text-blue-500 underline-offset-4";

function toUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

export function isExternalHref(href: string, siteOrigin?: string) {
  const url = toUrl(href);
  if (!url) return false;
  if (!siteOrigin) return true;
  try {
    const origin = new URL(siteOrigin).origin;
    return url.origin !== origin;
  } catch {
    return true;
  }
}

export function shortenUrlForDisplay(href: string, maxLength = 42) {
  const url = toUrl(href);
  if (!url) return href.length > maxLength ? `${href.slice(0, maxLength - 1)}…` : href;
  const host = url.hostname.replace(/^www\./i, "");
  const path = `${url.pathname}${url.search}`;
  const normalizedPath = path === "/" ? "" : path;
  const full = `${host}${normalizedPath}`;
  if (full.length <= maxLength) return full;

  const allowedPathLength = Math.max(0, maxLength - host.length - 2);
  if (allowedPathLength === 0) return `${host}…`;
  const compactPath = normalizedPath.slice(0, allowedPathLength);
  return `${host}${compactPath}…`;
}

export function faviconUrlFromHref(href: string) {
  const url = toUrl(href);
  const host = url?.hostname ?? "";
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : "";
}

export function buildEditorLinkMeta(href: string, siteOrigin?: string): EditorLinkMeta {
  const url = toUrl(href);
  const host = (url?.hostname ?? "").replace(/^www\./i, "");
  return {
    href,
    displayText: shortenUrlForDisplay(href),
    host,
    faviconUrl: faviconUrlFromHref(href),
    isExternal: isExternalHref(href, siteOrigin),
  };
}

export function sanitizeHref(href: string) {
  const trimmed = href.trim();
  if (trimmed.startsWith("/")) return trimmed;
  const url = toUrl(trimmed);
  if (!url) return "";
  if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) return "";
  return url.toString();
}

export function ensureExternalAttrs(anchorTag: string, href: string, siteOrigin?: string) {
  const external = isExternalHref(href, siteOrigin);
  const withTarget = external
    ? anchorTag.includes("target=")
      ? anchorTag.replace(/target=("|').*?("|')/i, 'target="_blank"')
      : anchorTag.replace("<a", '<a target="_blank"')
    : anchorTag.replace(/\s+target=("|').*?("|')/gi, "");

  if (!external) return withTarget.replace(/\s+rel=("|').*?("|')/gi, "");

  return withTarget.includes("rel=")
    ? withTarget.replace(/rel=("|').*?("|')/i, 'rel="noopener noreferrer nofollow"')
    : withTarget.replace("<a", '<a rel="noopener noreferrer nofollow"');
}

export function ensureAnchorClass(anchorTag: string, className = ARTICLE_LINK_CLASS) {
  if (!className.trim()) return anchorTag;
  if (anchorTag.includes("class=")) {
    return anchorTag.replace(/class=("|')(.*?)\1/i, (_m, quote: string, existing: string) => {
      const merged = Array.from(new Set(`${existing} ${className}`.split(/\s+/).filter(Boolean))).join(" ");
      return `class=${quote}${merged}${quote}`;
    });
  }
  return anchorTag.replace("<a", `<a class="${className}"`);
}
