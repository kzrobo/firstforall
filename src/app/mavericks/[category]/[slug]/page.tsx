import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntryView } from "@/components/hub/EntryView";
import { getI18n } from "@/i18n/server";
import { categoryTitle, isHubCategory } from "@/lib/hub/categories";
import { countryName } from "@/lib/hub/countries";
import { getPublishedEntry } from "@/lib/hub/repository";

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isHubCategory(category)) return {};
  const r = await getPublishedEntry(category, slug);
  if (!r.ok || !r.data) return { title: categoryTitle(category) };
  const e = r.data.entry;
  return { title: `${e.title} · ${categoryTitle(category)}`, description: e.summary ?? e.subtitle ?? undefined, openGraph: e.coverUrl ? { images: [e.coverUrl] } : undefined };
}

export default async function EntryPage({ params }: Props) {
  const { category, slug } = await params;
  if (!isHubCategory(category)) notFound();
  const [{ t, locale }, result] = await Promise.all([getI18n(), getPublishedEntry(category, slug)]);
  if (!result.ok) return <p className="mx-auto max-w-content px-5 py-20 text-ink-muted lg:px-10">{t.hub.notConfigured}</p>;
  if (!result.data) notFound();
  const { entry, related } = result.data;
  return <EntryView e={entry} related={related} t={t} locale={locale} country={countryName(entry.countryCode, locale)} />;
}
