/** Draws a list as a PNG (one title, one line per item) so it can be pasted into a chat or saved. */
export async function listImage(title: string, names: string[]): Promise<Blob | null> {
  const w = 640, pad = 40, line = 52, head = 96;
  const h = head + names.length * line + pad;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#111111";
  g.font = "600 30px system-ui, sans-serif";
  g.fillText(title, pad, 62);
  g.font = "400 26px system-ui, sans-serif";
  names.forEach((n, i) => {
    const y = head + i * line + 30;
    g.strokeStyle = "#111111";
    g.lineWidth = 2;
    g.strokeRect(pad, y - 22, 26, 26);
    g.fillText(n, pad + 46, y);
  });
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

export const mailtoHref = (title: string, text: string) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;

/** Copies the image to the clipboard; when the browser will not, saves it as a file instead. Returns what happened. */
export async function copyOrSaveImage(blob: Blob, name: string): Promise<"copied" | "saved"> {
  try {
    if (navigator.clipboard && "ClipboardItem" in window) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return "copied";
    }
  } catch {
    /* fall through to a download */
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
  return "saved";
}
