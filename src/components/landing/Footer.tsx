import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <p className="text-center text-sm text-ni-muted">{BRAND.footer}</p>
    </footer>
  );
}
