import { MANUAL_LANGUAGE_COOKIE } from "@/lib/manuals/language";

/** Remembers an explicitly chosen PDF language for the rest of this visit (session cookie, no expiry). */
export function rememberManualLanguage(language: string): void {
  try {
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${MANUAL_LANGUAGE_COOKIE}=${encodeURIComponent(language)}; path=/; samesite=lax${secure}`;
  } catch {
    // cookies blocked: the URL still carries the language
  }
}
