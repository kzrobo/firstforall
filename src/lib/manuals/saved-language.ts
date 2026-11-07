import "server-only";
import { cookies } from "next/headers";
import { MANUAL_LANGUAGE_COOKIE } from "./language";

/** The PDF language the visitor picked during this visit (session cookie), if any. */
export async function getSavedManualLanguage(): Promise<string | null> {
  const v = (await cookies()).get(MANUAL_LANGUAGE_COOKIE)?.value;
  return v && /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(v) ? v : null;
}
