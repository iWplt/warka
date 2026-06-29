export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropOutputOptions = {
  maxWidth?: number;
  maxHeight?: number;
  mimeType?: string;
  quality?: number;
};

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function getCroppedImageDataUrl(
  image: HTMLImageElement,
  crop: CropArea,
  options: CropOutputOptions = {}
): string {
  const { maxWidth = 2000, maxHeight = 2000, mimeType = "image/jpeg", quality = 0.92 } = options;

  let outW = crop.width;
  let outH = crop.height;
  if (outW > maxWidth || outH > maxHeight) {
    const ratio = Math.min(maxWidth / outW, maxHeight / outH);
    outW = Math.round(outW * ratio);
    outH = Math.round(outH * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);
  return canvas.toDataURL(mimeType, quality);
}

export function getDefaultCrop(image: HTMLImageElement): CropArea {
  const size = Math.min(image.naturalWidth, image.naturalHeight);
  const x = (image.naturalWidth - size) / 2;
  const y = (image.naturalHeight - size) / 2;
  return { x, y, width: size, height: size };
}
