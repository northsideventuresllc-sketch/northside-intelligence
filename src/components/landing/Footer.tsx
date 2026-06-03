import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative border-t border-cyan-500/10 px-6 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <p className="text-center text-sm text-ni-muted">{BRAND.footer}</p>
    </footer>
  );
}
