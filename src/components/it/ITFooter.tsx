import Link from "next/link";
import { APP_VERSION } from "@/lib/version";

interface ITFooterProps {
  toolName?: string;
}

/**
 * Shared footer for every IT page: links + version display.
 */
export function ITFooter({ toolName }: ITFooterProps) {
  return (
    <footer className="border-t border-white/10 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/50">
          <Link href="/legal/terms" className="hover:text-white/80">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="hover:text-white/80">
            Privacy Policy
          </Link>
          <Link href="/feedback" className="hover:text-white/80">
            Report a bug / Suggest an idea
          </Link>
        </div>
        <p className="font-mono text-[11px] text-white/35">
          {toolName ? `${toolName} ` : ""}{APP_VERSION} · Northside Intelligence
        </p>
      </div>
    </footer>
  );
}
