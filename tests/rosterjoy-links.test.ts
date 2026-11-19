import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import graph from "../src/data/graph.data.json" with { type: "json" };
import {
  ROSTERJOY_HOME_URL,
  ROSTERJOY_PTA_URL,
  linkifyRosterJoy,
  rosterJoyHref,
} from "../src/ui/rosterjoy-link.ts";

const html = readFileSync(resolve("index.html"), "utf8");

describe("RosterJoy links", () => {
  it("sends school and PTA volunteering mentions to the PTA page", () => {
    expect(rosterJoyHref("RosterJoy for the PTA")).toBe(ROSTERJOY_PTA_URL);
    expect(rosterJoyHref("RosterJoy for school volunteer signups")).toBe(ROSTERJOY_PTA_URL);
    expect(rosterJoyHref("RosterJoy for school volunteering")).toBe(ROSTERJOY_PTA_URL);
    expect(linkifyRosterJoy("RosterJoy for PTA signups")).toContain(`href="${ROSTERJOY_PTA_URL}"`);
  });

  it("sends every other mention home", () => {
    expect(rosterJoyHref("Building RosterJoy.")).toBe(ROSTERJOY_HOME_URL);
    expect(rosterJoyHref("Volunteer shifts on RosterJoy")).toBe(ROSTERJOY_HOME_URL);
    expect(rosterJoyHref("RosterJoy at Wake Forest")).toBe(ROSTERJOY_HOME_URL);
  });

  it("wraps the name once and does not add nofollow", () => {
    const linked = linkifyRosterJoy("See RosterJoy.");
    expect(linked.match(/<a /g)).toHaveLength(1);
    expect(linked).toContain(`href="${ROSTERJOY_HOME_URL}"`);
    expect(linked).toContain('rel="noopener"');
    expect(linked).toContain('target="_blank"');
    expect(linked).not.toMatch(/nofollow|sponsored|ugc/);
    expect(linked.endsWith(".")).toBe(true);
  });

  it("escapes text around the mention", () => {
    const linked = linkifyRosterJoy(`<b>RosterJoy</b>`);
    expect(linked).not.toContain("<b>");
    expect(linked).toContain("&lt;b&gt;");
    expect(linked.match(/<a /g)).toHaveLength(1);
  });

  it("points the product node at the canonical home URL", () => {
    const node = graph.nodes.find((item) => item.id === "rosterjoy");
    expect(node?.url).toBe(ROSTERJOY_HOME_URL);
  });

  it("classifies every RosterJoy string in the graph as a home-page mention", () => {
    const mentions = collectMentions(graph);
    const exact = mentions.filter((item) => item.text === "RosterJoy").map((item) => item.path);
    expect(exact).toContain("copy.reasons[1]");
    expect(exact).toContain("groups.product.label");
    expect(exact).toContain("groups.product.kind");
    expect(
      exact.filter((path) => path.endsWith(".label") && path.startsWith("nodes")),
    ).toHaveLength(1);

    const blurbs = mentions.filter((item) => item.path.endsWith(".blurb")).map((item) => item.text);
    expect(blurbs).toHaveLength(3);
    expect(blurbs.some((text) => text.startsWith("Building RosterJoy"))).toBe(true);
    expect(blurbs.some((text) => text.includes("quieter alternative"))).toBe(true);
    expect(blurbs.some((text) => text.startsWith("How RosterJoy"))).toBe(true);
    expect(mentions).toHaveLength(exact.length + blurbs.length);

    for (const item of mentions) {
      expect(rosterJoyHref(item.text), item.path).toBe(ROSTERJOY_HOME_URL);
      if (item.path.startsWith("copy.reasons")) continue;
      const linked = linkifyRosterJoy(item.text);
      expect(linked, item.path).toContain(`href="${ROSTERJOY_HOME_URL}"`);
      expect(linked, item.path).not.toMatch(/nofollow|sponsored|ugc/);
    }
  });

  it("links the plain-text mentions and leaves meta descriptions and the contact reason as text", () => {
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain("Building RosterJoy");
    expect(head).not.toContain("<a");

    const plain = html
      .slice(html.indexOf('id="plain"'), html.indexOf("</section>"))
      .replace(/\s+/g, " ");
    const withoutAnchors = plain.replace(/<a\b[^>]*>\s*RosterJoy\s*<\/a\s*>/g, "");
    expect(plain.match(/href="https:\/\/www\.rosterjoy\.com\/"/g)).toHaveLength(2);
    expect(withoutAnchors).not.toContain("RosterJoy");
    expect(plain).not.toMatch(/nofollow|sponsored|ugc/);

    expect(html).toContain('<input type="radio" name="reason" value="RosterJoy" /> RosterJoy');
  });
});

function collectMentions(value: unknown, path = ""): { path: string; text: string }[] {
  if (typeof value === "string") {
    return value.includes("RosterJoy") ? [{ path: path || "(root)", text: value }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectMentions(item, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      collectMentions(child, path ? `${path}.${key}` : key),
    );
  }
  return [];
}
