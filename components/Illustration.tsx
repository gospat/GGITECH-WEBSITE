"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
};

export default function Illustration({ src, alt, className, priority, sizes, unoptimized }: Props) {
  const forceUnoptimized = process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === "true";
  const defaultUnoptimized = process.env.NODE_ENV !== "production";
  const shouldUnoptimized = unoptimized ?? (forceUnoptimized || defaultUnoptimized);

  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={900}
      priority={priority}
      sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
      className={className ?? ""}
      unoptimized={shouldUnoptimized}
    />
  );
}
