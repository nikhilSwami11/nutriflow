/** One food, however it is written: "Onions", "onion " and "onion" match. shortcut: English plurals only. */
export const foodKey = (s: string) => s.trim().toLowerCase().replace(/(es|s)$/, "");

/** True when the pantry has some of this food left. */
export const hasFood = (pantry: { name: string; qty: number }[], name: string) => pantry.some((p) => p.qty > 0 && foodKey(p.name) === foodKey(name));
