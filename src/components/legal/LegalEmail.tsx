import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/constants";

export function LegalEmail() {
  return (
    <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300">
      {LEGAL_CONTACT_EMAIL}
    </a>
  );
}
