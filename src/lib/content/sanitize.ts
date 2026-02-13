import { ensureExternalAttrs, faviconUrlFromHref, sanitizeHref, shortenUrlForDisplay } from "@/lib/content/links";

const ALLOWED_TAGS = ["h2", "h3", "p", "strong", "em", "a", "ul", "ol", "li", "br"];

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripDisallowedTags(input: string) {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-zA-Z0-9:-]+)([^>]*)>/g, (full, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.includes(tag)) return "";
      if (tag === "br") return "<br />";
      if (full.startsWith("</")) return `</${tag}>`;

      if (tag === "a") {
        const hrefMatch = attrs.match(/href=("|')(.*?)("|')/i);
        const href = sanitizeHref(hrefMatch?.[2] ?? "");
        if (!href) return "<span>";
        let anchor = `<a href="${escapeHtml(href)}">`;
        anchor = ensureExternalAttrs(anchor, href, "");
        return anchor;
      }
      return `<${tag}>`;
    })
    .replace(/<span>/g, "")
    .replace(/<\/span>/g, "");
}

export function sanitizeArticleHtml(input: string) {
  const stripped = stripDisallowedTags(input);
  return stripped.replace(/\n{3,}/g, "\n\n").trim();
}

export function enhanceArticleLinksHtml(input: string, siteOrigin?: string) {
  return input.replace(/<a([^>]*?)href=("|')(.*?)("|')([^>]*)>([\s\S]*?)<\/a>/gi, (_m, left, _q1, rawHref, _q2, right, inner) => {
    const href = sanitizeHref(rawHref);
    if (!href) return inner;

    let openTag = `<a${left}href="${escapeHtml(href)}"${right}>`;
    openTag = ensureExternalAttrs(openTag, href, siteOrigin);

    const textOnly = inner.replace(/<[^>]+>/g, "").trim();
    const label = textOnly || shortenUrlForDisplay(href);
    const favicon = faviconUrlFromHref(href);
    const icon = favicon ? `<img class="article-link-icon" src="${escapeHtml(favicon)}" alt="" loading="lazy" decoding="async" />` : "";

    return `${openTag}<span class="article-link-inner">${icon}<span>${escapeHtml(label)}</span></span></a>`;
  });
}
