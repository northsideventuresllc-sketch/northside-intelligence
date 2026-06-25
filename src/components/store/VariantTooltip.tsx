"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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

const POPUP_GAP = 10;
const VIEWPORT_PAD = 12;

export function VariantTooltip({
  variant,
  productDescription,
  productName,
}: VariantTooltipProps) {
  const popupId = useId();
  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<PopupPosition | null>(null);
  const [positioned, setPositioned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const open = hoverOpen || pinned;

  useEffect(() => {
    setMounted(true);
  }, []);

  const storedParts = variant.description
    ? {
        overview: formatUserFriendlyDescription(variant.description, productName),
        variation: "",
      }
    : buildVariantDescriptionParts(productDescription, variant.name, productName);

  const overviewParagraphs = descriptionToParagraphs(storedParts.overview);
  const variationText =
    storedParts.variation ||
    (variant.name.toLowerCase() !== "default"
      ? `This option is the ${variant.name} variation.`
      : "");

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const popup = popupRef.current;
    if (!anchor || !popup) return;

    const rect = anchor.getBoundingClientRect();
    const popupW = popup.offsetWidth;
    const popupH = popup.offsetHeight;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = rect.right + POPUP_GAP;
    if (left + popupW > viewportW - VIEWPORT_PAD) {
      left = rect.left - popupW - POPUP_GAP;
    }
    if (left < VIEWPORT_PAD) {
      left = Math.max(VIEWPORT_PAD, Math.min(rect.left, viewportW - popupW - VIEWPORT_PAD));
    }

    let top = rect.top + rect.height / 2 - popupH / 2;
    if (top < VIEWPORT_PAD) top = VIEWPORT_PAD;
    if (top + popupH > viewportH - VIEWPORT_PAD) {
      top = Math.max(VIEWPORT_PAD, viewportH - popupH - VIEWPORT_PAD);
    }

    setPosition({ top, left });
    setPositioned(true);
  }, []);

  const openPopup = useCallback(
    (pin: boolean) => {
      setPositioned(false);
      setPosition(null);
      if (pin) {
        setPinned(true);
        setHoverOpen(false);
      } else {
        setHoverOpen(true);
      }
    },
    []
  );

  const closePopup = useCallback(() => {
    setPinned(false);
    setHoverOpen(false);
    setPositioned(false);
    setPosition(null);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, overviewParagraphs.length, variationText, variant.imageUrl]);

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
      if (popupRef.current?.contains(target)) return;
      closePopup();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closePopup();
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closePopup]);

  const popup =
    open && mounted ? (
      <div
        ref={popupRef}
        id={popupId}
        role="dialog"
        aria-labelledby={`${popupId}-title`}
        className={`fixed z-[250] w-[min(340px,calc(100vw-24px))] rounded-2xl border border-cyan-400/25 bg-[#0c0e14] p-4 shadow-2xl shadow-black/60 transition-opacity duration-100 ${
          positioned ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={
          position
            ? { top: position.top, left: position.left }
            : { top: -9999, left: -9999, visibility: "hidden" as const }
        }
        onMouseEnter={() => {
          if (!pinned) setHoverOpen(true);
        }}
        onMouseLeave={() => {
          if (!pinned) setHoverOpen(false);
        }}
      >
        <p
          id={`${popupId}-title`}
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"
        >
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

        <div className="space-y-2">
          {overviewParagraphs.map((para, i) => (
            <p key={`overview-${i}`} className="text-xs leading-relaxed text-white/85">
              {para}
            </p>
          ))}
          {variationText && (
            <p className="border-t border-white/10 pt-2 text-xs leading-relaxed text-cyan-100/90">
              {variationText}
            </p>
          )}
        </div>

        {pinned && (
          <p className="mt-3 text-[10px] text-ni-muted">
            Click outside or press Esc to close.
          </p>
        )}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition ${
          pinned
            ? "border-cyan-300/60 bg-cyan-500/25 text-cyan-100"
            : "border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:border-cyan-300/50 hover:bg-cyan-500/20"
        }`}
        aria-label={`View details for ${variant.name}`}
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        onMouseEnter={() => {
          if (!pinned) openPopup(false);
        }}
        onMouseLeave={() => {
          if (!pinned) setHoverOpen(false);
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (pinned) closePopup();
          else openPopup(true);
        }}
      >
        i
      </button>
      {mounted && popup ? createPortal(popup, document.body) : null}
    </>
  );
}
