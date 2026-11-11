import { describe, expect, it } from "vitest";

import { causeProgressPercent, foreignLang, imageSources, mediaSrc } from "@/lib/zakat/content";

const media = (id: number, size?: string) =>
  `http://196.188.249.232/api/zakat/v1/media/${id}${size ? `?size=${size}` : ""}`;

describe("mediaSrc", () => {
  it("serves zakat media through the site, keeping a known size", () => {
    expect(mediaSrc(media(5))).toBe("/bff/media/5");
    expect(mediaSrc(media(5, "thumbnail"))).toBe("/bff/media/5?size=thumbnail");
    expect(mediaSrc(media(5, "huge"))).toBe("/bff/media/5");
  });

  it("passes other URLs through", () => {
    expect(mediaSrc("/images/cause.webp")).toBe("/images/cause.webp");
    expect(mediaSrc(null)).toBeNull();
  });
});

describe("imageSources", () => {
  it("offers the smaller copies as a srcset", () => {
    const variants = { thumbnail: media(5, "thumbnail"), medium: media(5, "medium"), large: media(5, "large") };
    expect(imageSources(media(5), variants)).toEqual({
      src: "/bff/media/5",
      srcSet: "/bff/media/5?size=thumbnail 400w, /bff/media/5?size=medium 800w, /bff/media/5?size=large 1600w",
    });
  });

  it("has no srcset without copies, and nothing without an image", () => {
    expect(imageSources(media(5), null)).toEqual({ src: "/bff/media/5" });
    expect(imageSources(null, { thumbnail: media(5, "thumbnail") })).toBeNull();
  });
});

describe("foreignLang", () => {
  it("marks admin text that isn't in the page's language", () => {
    expect(foreignLang("en", "am")).toBe("en");
    expect(foreignLang(undefined, "ar")).toBe("en");
    expect(foreignLang("am", "am")).toBeUndefined();
    expect(foreignLang(undefined, "en")).toBeUndefined();
  });
});

describe("causeProgressPercent", () => {
  it("follows raisedEtb (offline plus live) against the goal", () => {
    expect(causeProgressPercent({ raisedEtb: 6000, goalEtb: 100000, progress: 0.01 })).toBe(6);
    expect(causeProgressPercent({ raisedEtb: 69, goalEtb: 34, progress: 1 })).toBe(202);
  });

  it("never rounds up to a goal that isn't reached", () => {
    expect(causeProgressPercent({ raisedEtb: 999, goalEtb: 1000, progress: null })).toBe(99);
  });

  it("falls back to the service's progress", () => {
    expect(causeProgressPercent({ raisedEtb: null, goalEtb: 1000, progress: 0.25 })).toBe(25);
    expect(causeProgressPercent({ raisedEtb: 10, goalEtb: null, progress: null })).toBeNull();
  });
});
