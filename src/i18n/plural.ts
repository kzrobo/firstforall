/** Picks the right noun form for a count. Russian needs one/few/many; the others need one/other. */
export function plural(locale: string, n: number, forms: { one: string; few: string; many: string }): string {
  const cat = new Intl.PluralRules(locale).select(n);
  if (cat === "one") return forms.one;
  if (cat === "few") return forms.few;
  return forms.many;
}
