import Image from "next/image";

import { cn } from "@/lib/utils";

type SubraLogoProps = {
  className?: string;
  preload?: boolean;
};

export function SubraLogo({ className, preload = false }: SubraLogoProps) {
  return (
    <Image
      src="/media/subra-logo.png"
      alt="Subra"
      width={1660}
      height={373}
      preload={preload}
      unoptimized
      sizes="(min-width: 640px) 128px, 112px"
      className={cn("h-auto w-28", className)}
    />
  );
}
