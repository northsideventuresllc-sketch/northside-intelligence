export function StockImageDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100/90 ${className}`}
      role="note"
    >
      Representative image — this photo may not match the exact CJ listing. Verify the product title
      on CJ before ordering.
    </p>
  );
}
