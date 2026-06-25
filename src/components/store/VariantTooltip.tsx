"use client";

import { useEffect, useRef, useState } from "react";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import type { CatalogVariantView } from "@/lib/store/catalog/types";

interface VariantTooltipProps {
  variant: CatalogVariantView;
  productDescription: string;
}

export function VariantTooltip({ variant, productDescription }: VariantTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const description =
    variant.description ??
    (productDescription
      ? `${productDescription}\n\nThis variation: ${variant.name}.`
      : `This variation: ${variant.name}.`);

  const paragraphs = description.split(/\n\n+/).filter(Boolean);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] text-white/50 hover:border-cyan-400/40 hover:text-cyan-200"
        aria-label={`Details for ${variant.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-white/15 bg-[#0c0e14]/98 p-3 shadow-2xl backdrop-blur-xl"
        >
          {variant.imageUrl && (
            <div className="mb-2 flex justify-center">
              <StoreProductImage
                src={variant.imageUrl}
                alt={variant.name}
                width={120}
                height={120}
                className="max-h-24 object-contain"
              />
            </div>
          )}
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={`text-xs leading-relaxed text-white/80 ${i > 0 ? "mt-2" : ""}`}
            >
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
