import fs from "fs";
import path from "path";

let cachedLogoDataUrl: string | null = null;

export function getWarkaLogoDataUrl(): string {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  const filePath = path.join(process.cwd(), "public/assets/brand/warka-logo.png");
  const buffer = fs.readFileSync(filePath);
  cachedLogoDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  return cachedLogoDataUrl;
}
