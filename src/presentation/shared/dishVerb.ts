/** "Cook" fits food on a stove; a drink is made, not cooked. */
export const dishVerb = (name: string) => (/\b(smoothie|shake|juice|lassi|coffee|tea|milk|water)\b/i.test(name) ? "Make" : "Cook");
