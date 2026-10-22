import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isUiLocale, negotiateLocale, type UiLocale } from "./config";
import { getDictionary } from "./dictionary";

export async function getLocale(): Promise<UiLocale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isUiLocale(stored)) return stored;
  return negotiateLocale((await headers()).get("accept-language"));
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
