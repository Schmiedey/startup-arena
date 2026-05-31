"use client";

import { useState } from "react";
import Image from "next/image";

interface AvatarProps {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 36, className = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || "A")[0].toUpperCase();

  if (!src || imgError) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-fire/10 font-bold text-fire ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </div>
    );
  }

  // Data URIs can't use next/image optimization — use regular img
  if (src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      onError={() => setImgError(true)}
    />
  );
}
