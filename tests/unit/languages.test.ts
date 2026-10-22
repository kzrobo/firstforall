import { describe, expect, it } from "vitest";
import { languageName, nativeLanguageName } from "@/lib/languages";

describe("language names", () => {
  it("are deterministic for the core languages in every UI locale", () => {
    expect(languageName("en", "kk")).toBe("Ағылшын");
    expect(languageName("kk", "ru")).toBe("Казахский");
    expect(languageName("es", "es")).toBe("Español");
    expect(nativeLanguageName("kk")).toBe("Қазақша");
  });
  it("still names additional CMS languages", () => {
    expect(languageName("fr", "en")).toBe("French");
  });
});
