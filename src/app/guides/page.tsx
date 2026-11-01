import { permanentRedirect } from "next/navigation";

/** Technical guides are now video lessons in LEARN. */
export default function GuidesPage() {
  permanentRedirect("/learn");
}
