import Image from "next/image";
import { Bowl } from "./Bowl";

/** The dish picture (a transparent cut-out that sits on the recipe's tint), or the drawn bowl when there is none. */
export function RecipeArt({ image, size }: { image?: string; size: number }) {
  if (!image) return <Bowl size={Math.round(size * 0.6)} />;
  return <Image src={image} alt="" width={size} height={size} sizes={`${size}px`} className="object-contain" draggable={false} />;
}
