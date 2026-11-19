/** Canonical RosterJoy destinations. School or PTA volunteering uses the PTA page. */
export const ROSTERJOY_HOME_URL = "https://www.rosterjoy.com/";
export const ROSTERJOY_PTA_URL = "https://www.rosterjoy.com/for/pta";

const MENTION = "RosterJoy";

export function mentionsRosterJoy(text: string): boolean {
  return text.includes(MENTION);
}

/**
 * PTA mentions, and mentions about volunteering at school, go to the PTA page.
 * Every other mention goes to the product home page.
 */
export function rosterJoyHref(context: string): string {
  const pta = /\bpta\b/i.test(context);
  const schoolVolunteering = /\bschools?\b/i.test(context) && /\bvolunteer/i.test(context);
  return pta || schoolVolunteering ? ROSTERJOY_PTA_URL : ROSTERJOY_HOME_URL;
}

export interface RosterJoyLinkAttrs {
  className?: string;
  dataId?: string;
}

/** Escape plain text and wrap each RosterJoy mention in one anchor. */
export function linkifyRosterJoy(
  text: string,
  context = text,
  attrs: RosterJoyLinkAttrs = {},
): string {
  const href = rosterJoyHref(context);
  const className = attrs.className ?? "text-link";
  const data = attrs.dataId ? ` data-id="${escapeAttr(attrs.dataId)}"` : "";
  const anchor =
    `<a class="${escapeAttr(className)}" href="${escapeAttr(href)}" target="_blank" rel="noopener"${data}>` +
    `${MENTION}</a>`;
  return escapeHtml(text).replaceAll(MENTION, anchor);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
