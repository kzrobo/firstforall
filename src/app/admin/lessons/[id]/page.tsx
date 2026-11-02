import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamSession } from "@/lib/auth/session";
import { getLessonForAdmin } from "@/lib/learn/repository";
import { LessonForm } from "../LessonForm";

export const metadata = { title: "Edit lesson · Admin" };

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [session, result] = await Promise.all([getTeamSession(), getLessonForAdmin(id, "en")]);
  if (!result.ok) return <p className="text-ink-muted">Could not load the lesson.</p>;
  if (!result.data) notFound();
  return (
    <div>
      <Link href="/admin/lessons" className="text-[14px] text-ink-muted hover:text-ink">← Lessons</Link>
      <h1 className="t-h2 mt-3 border-b border-rule pb-4 text-ink">Edit lesson</h1>
      <div className="mt-8">
        <LessonForm lesson={result.data} categories={result.categories} canPublish={Boolean(session?.canPublish)} />
      </div>
    </div>
  );
}
