"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function wrapIndex(i: number, len: number): number {
  return ((i % len) + len) % len;
}

export function useCarousel(length: number, autoAdvanceMs = 6000) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState<"in" | "out">("in");
  const fadingRef = useRef(false);

  const safeIndex = length ? wrapIndex(index, length) : 0;

  const go = useCallback(
    (delta: number) => {
      if (!length || fadingRef.current) return;
      fadingRef.current = true;
      setFade("out");
      window.setTimeout(() => {
        setIndex((i) => wrapIndex(i + delta, length));
        setFade("in");
        fadingRef.current = false;
      }, 280);
    },
    [length]
  );

  const goTo = useCallback(
    (target: number) => {
      if (!length || fadingRef.current || target === safeIndex) return;
      fadingRef.current = true;
      setFade("out");
      window.setTimeout(() => {
        setIndex(wrapIndex(target, length));
        setFade("in");
        fadingRef.current = false;
      }, 280);
    },
    [length, safeIndex]
  );

  useEffect(() => {
    if (length <= 1) return;
    const timer = window.setInterval(() => {
      if (fadingRef.current) return;
      fadingRef.current = true;
      setFade("out");
      window.setTimeout(() => {
        setIndex((i) => wrapIndex(i + 1, length));
        setFade("in");
        fadingRef.current = false;
      }, 280);
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [length, autoAdvanceMs]);

  return { safeIndex, fade, go, goTo, setIndex };
}
