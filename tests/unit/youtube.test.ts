import { describe, expect, it } from "vitest";
import { formatDuration, parseDuration, parseYouTubeUrl, slugify, youTubeEmbedUrl } from "@/lib/learn/youtube";

const ID = "dQw4w9WgXcQ";

describe("parseYouTubeUrl", () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s&list=PL123`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `youtube.com/watch?v=${ID}`,
    `  https://youtu.be/${ID}  `,
  ])("accepts %s", (url) => expect(parseYouTubeUrl(url)).toBe(ID));

  it.each([
    "",
    "not a url",
    `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>`,
    `https://evil.com/watch?v=${ID}`,
    `https://youtube.com.evil.com/watch?v=${ID}`,
    "https://www.youtube.com/playlist?list=PL123",
    "https://www.youtube.com/watch?v=short",
    `javascript:alert(1)//youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/watch?v=${ID}"onload="x`,
    `ftp://youtube.com/watch?v=${ID}`,
  ])("rejects %s", (url) => expect(parseYouTubeUrl(url)).toBeNull());
});

describe("durations", () => {
  it("parses and formats", () => {
    expect(parseDuration("12:05")).toBe(725);
    expect(parseDuration("1:02:03")).toBe(3723);
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("12:75")).toBeNaN();
    expect(parseDuration("abc")).toBeNaN();
    expect(formatDuration(725)).toBe("12:05");
    expect(formatDuration(3723)).toBe("1:02:03");
    expect(formatDuration(null)).toBeNull();
  });
});

describe("helpers", () => {
  it("builds privacy-enhanced embeds", () => {
    expect(youTubeEmbedUrl(ID)).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
  });
  it("slugifies titles", () => {
    expect(slugify("Fusion 360 basics: your first bracket!")).toBe("fusion-360-basics-your-first-bracket");
    expect(slugify("Основы FTC")).toBe("ftc");
  });
});
