import Link from "next/link";
import { getTeamSession } from "@/lib/auth/session";
import { listCategories } from "@/lib/learn/repository";
import { LessonForm } from "../LessonForm";

export const metadata = { title: "Add lesson · Admin" };

export default async function NewLessonPage() {
  const [session, cats] = await Promise.all([getTeamSession(), listCategories("en")]);
  return (
    <div>
      <Link href="/admin/lessons" className="text-[14px] text-ink-muted hover:text-navy">← Lessons</Link>
      <h1 className="t-h2 mt-3 border-b border-navy pb-4 text-navy">Add lesson</h1>
      <div className="mt-8">
        {cats.ok ? <LessonForm categories={cats.data} canPublish={Boolean(session?.canPublish)} /> : <p className="text-ink-muted">Could not load categories.</p>}
      </div>
    </div>
  );
}
