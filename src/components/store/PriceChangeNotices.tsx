import { formatStorePrice } from "@/lib/store/client";
import type { PriceChangeNoticeView } from "@/lib/store/catalog/types";

export function PriceChangeNotices({
  notices,
  className = "",
}: {
  notices: PriceChangeNoticeView[];
  className?: string;
}) {
  if (!notices.length) return null;

  return (
    <div
      className={`space-y-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 ${className}`}
      role="alert"
    >
      <p className="text-sm font-semibold text-amber-100">Prices Updated From CJ</p>
      <ul className="space-y-2 text-xs leading-relaxed text-amber-100/90">
        {notices.map((notice) => (
          <li key={notice.slug}>
            <span className="font-medium text-white">{notice.name}</span>:{" "}
            {formatStorePrice(notice.previousRetailCents)} →{" "}
            {formatStorePrice(notice.currentRetailCents)}. {notice.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
