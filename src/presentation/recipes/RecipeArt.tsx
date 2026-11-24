import Image from "next/image";
import { Bowl } from "./Bowl";

/** The dish picture (a transparent cut-out that sits on the recipe's tint), or the drawn bowl when there is none. */
/** `eager`: the picture at the top of a screen, which is the largest thing painted: load it first. */
export function RecipeArt({ image, size, eager }: { image?: string; size: number; eager?: boolean }) {
  if (!image) return <Bowl size={Math.round(size * 0.6)} />;
  return <Image src={image} alt="" width={size} height={size} sizes={`${size}px`} className="object-contain" draggable={false} loading={eager ? "eager" : undefined} fetchPriority={eager ? "high" : undefined} />;
}
