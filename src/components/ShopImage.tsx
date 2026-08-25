"use client";

import Image, { type ImageProps } from "next/image";

const CLOUDINARY_HOST = /^res(-\d+)?\.cloudinary\.com$/i;

export function isCloudinarySrc(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;
  try {
    return CLOUDINARY_HOST.test(new URL(src).hostname);
  } catch {
    return CLOUDINARY_HOST.test(src);
  }
}

/**
 * Cloudinary ya entrega AVIF/WebP con `f_auto,q_auto`.
 * `unoptimized` evita que Next vuelva a bajar y recomprimir el original.
 */
export function ShopImage({ unoptimized, ...props }: ImageProps) {
  const skipOptimizer = unoptimized ?? isCloudinarySrc(props.src);
  return <Image {...props} unoptimized={skipOptimizer} />;
}
