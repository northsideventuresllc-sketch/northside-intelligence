import Image from "next/image";

interface StoreProductImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/** External dropship / web-search images — skip Next image optimization domain checks. */
export function StoreProductImage({ src, alt, width, height, className }: StoreProductImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}
