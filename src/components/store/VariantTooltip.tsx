"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import type { CatalogVariantView } from "@/lib/store/catalog/types";
import {
  buildVariantDescriptionParts,
  descriptionToParagraphs,
  formatUserFriendlyDescription,
} from "@/lib/store/catalog/description";

interface VariantTooltipProps {
  variant: CatalogVariantView;
  productDescription: string;
  productName: string;
}

interface PopupPosition {
  top: number;
  left: number;
}

const POPUP_WIDTH = 300;
const POPUP_GAP = 10;

export function VariantTooltip({
  variant,
  productDescription,
  productName,
}: VariantTooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopupPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const estimatedHeight = 220;

    let left = rect.right + POPUP_GAP;
    if (left + POPUP_WIDTH > viewportW - 12) {
      left = Math.max(12, rect.left - POPUP_WIDTH - POPUP_GAP);
    }
    if (left < 12) {
      left = Math.min(12, rect.left);
    }

    let top = rect.top;
    if (top + estimatedHeight > viewportH - 12) {
      top = Math.max(12, viewportH - estimatedHeight - 12);
    }

    setPosition({ top, left });
  }, []);

  const show = useCallback(() => {
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const hide = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onScrollOrResize() {
      updatePosition();
    }

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      const popup = document.getElementById(`variant-popup-${variant.id}`);
      if (popup?.contains(target)) return;
      hide();
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open, hide, variant.id]);

  const storedParts = variant.description
    ? {
        overview: formatUserFriendlyDescription(variant.description, productName),
        variation: "",
      }
    : buildVariantDescriptionParts(productDescription, variant.name, productName);

  const overviewParagraphs = descriptionToParagraphs(storedParts.overview);
  const variationText = storedParts.variation || (
    variant.name.toLowerCase() !== "default"
      ? `This option is the ${variant.name} variation.`
      : ""
  );

  const popup =
    open && position && mounted ? (
      <div
        id={`variant-popup-${variant.id}`}
        role="tooltip"
        className="fixed z-[200] w-[min(300px,calc(100vw-24px))] rounded-2xl border border-cyan-400/20 bg-[#0c0e14] p-4 shadow-2xl shadow-black/50"
        style={{ top: position.top, left: position.left }}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
          {variant.name}
        </p>

        {variant.imageUrl && (
          <div className="mb-3 flex justify-center rounded-xl border border-white/10 bg-white/5 p-2">
            <StoreProductImage
              src={variant.imageUrl}
              alt={variant.name}
              width={140}
              height={140}
              className="max-h-28 object-contain"
            />
          </div>
        )}

        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {overviewParagraphs.map((para, i) => (
            <p key={`overview-${i}`} className="text-xs leading-relaxed text-white/80">
              {para}
            </p>
          ))}
          {variationText && (
            <p className="border-t border-white/10 pt-2 text-xs leading-relaxed text-cyan-100/90">
              {variationText}
            </p>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex shrink-0"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-[10px] font-semibold text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-500/20"
          aria-label={`View details for ${variant.name}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (open) hide();
            else show();
          }}
        >
          i
        </button>
      </span>
      {mounted && popup ? createPortal(popup, document.body) : null}
    </>
  );
}
