import {
  descriptionToParagraphs,
  formatUserFriendlyDescription,
} from "@/lib/store/catalog/description";

interface StoreProductDescriptionProps {
  description: string;
  productName: string;
  className?: string;
}

export function StoreProductDescription({
  description,
  productName,
  className = "",
}: StoreProductDescriptionProps) {
  const friendly = formatUserFriendlyDescription(description, productName);
  const paragraphs = descriptionToParagraphs(friendly);

  if (!paragraphs.length) return null;

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`}
      aria-label="Product description"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
        About This Item
      </p>
      <div className="space-y-3">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-white/75">
            {para}
          </p>
        ))}
      </div>
    </section>
  );
}
