const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const MAX_PRODUCT_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 5 * 1024 * 1024;
const MAX_EXCEL_BYTES = 5 * 1024 * 1024;
const MAX_FONT_BYTES = 2 * 1024 * 1024;

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const FONT_EXTENSIONS = new Set([".ttf", ".otf", ".woff", ".woff2"]);

export type UploadValidationResult =
  | { ok: true; contentType: string; sizeBytes: number }
  | { ok: false; error: string };

function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function sniffExcel(buffer: Buffer): boolean {
  // XLSX is ZIP (PK..)
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) return true;
  // Legacy XLS OLE compound
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return true;
  }
  return false;
}

function sniffFont(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;
  if (ext === ".woff2") return buffer[0] === 0x77 && buffer[1] === 0x4f && buffer[2] === 0x46 && buffer[3] === 0x32;
  if (ext === ".woff") return buffer[0] === 0x77 && buffer[1] === 0x4f && buffer[2] === 0x46 && buffer[3] === 0x46;
  // TTF / OTF: version tags
  const tag = buffer.toString("ascii", 0, 4);
  if (tag === "OTTO" || tag === "true" || tag === "typ1") return true;
  if (buffer[0] === 0x00 && buffer[1] === 0x01 && buffer[2] === 0x00 && buffer[3] === 0x00) return true;
  return false;
}

function decodeBase64Payload(base64: string): Buffer | null {
  try {
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

export function validateImageDataUrl(
  dataUrl: string,
  maxBytes: number
): UploadValidationResult {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "Invalid image data" };
  }

  const claimedType = match[1].toLowerCase();
  if (!IMAGE_MIME_TYPES.has(claimedType)) {
    return { ok: false, error: "Only PNG, JPEG, WebP, or GIF images are allowed" };
  }

  const buffer = decodeBase64Payload(match[2]);
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: "Invalid image data" };
  }

  if (buffer.length > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `File exceeds ${mb}MB limit` };
  }

  const sniffed = sniffImageMime(buffer);
  if (!sniffed) {
    return { ok: false, error: "File content is not a valid image" };
  }

  // jpeg/jpg equivalence
  const normalizedClaimed = claimedType === "image/jpg" ? "image/jpeg" : claimedType;
  if (sniffed !== normalizedClaimed && !(normalizedClaimed === "image/jpeg" && sniffed === "image/jpeg")) {
    // Allow claimed jpeg vs sniffed jpeg; reject type spoofing otherwise
    if (sniffed !== normalizedClaimed) {
      return { ok: false, error: "File type does not match image content" };
    }
  }

  return { ok: true, contentType: sniffed, sizeBytes: buffer.length };
}

export function validateProductImageDataUrl(dataUrl: string): UploadValidationResult {
  return validateImageDataUrl(dataUrl, MAX_PRODUCT_IMAGE_BYTES);
}

export function validateProductImageFile(file: File): UploadValidationResult {
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    return { ok: false, error: "Only PNG, JPEG, WebP, or GIF images are allowed" };
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 15MB or smaller" };
  }
  return { ok: true, contentType: file.type, sizeBytes: file.size };
}

export function validateLogoDataUrl(dataUrl: string): UploadValidationResult {
  return validateImageDataUrl(dataUrl, MAX_LOGO_BYTES);
}

export function validatePreviewDataUrl(dataUrl: string): UploadValidationResult {
  return validateImageDataUrl(dataUrl, MAX_PREVIEW_BYTES);
}

export function validateImageFile(file: File): UploadValidationResult {
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    return { ok: false, error: "Only PNG, JPEG, WebP, or GIF images are allowed" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: "Logo must be 2MB or smaller" };
  }
  return { ok: true, contentType: file.type, sizeBytes: file.size };
}

export function validateExcelFile(file: File): UploadValidationResult {
  const name = file.name.toLowerCase();
  const validMime =
    EXCEL_MIME_TYPES.has(file.type) ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls");
  if (!validMime) {
    return { ok: false, error: "Only Excel files (.xlsx) are allowed" };
  }
  if (file.size > MAX_EXCEL_BYTES) {
    return { ok: false, error: "Excel file must be 5MB or smaller" };
  }
  return {
    ok: true,
    contentType:
      file.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: file.size,
  };
}

export function validateExcelBase64(base64File: string): UploadValidationResult {
  const buffer = decodeBase64Payload(base64File);
  if (!buffer) {
    return { ok: false, error: "Invalid Excel file data" };
  }
  if (buffer.length > MAX_EXCEL_BYTES) {
    return { ok: false, error: "Excel file must be 5MB or smaller" };
  }
  if (!sniffExcel(buffer)) {
    return { ok: false, error: "File content is not a valid Excel document" };
  }
  return {
    ok: true,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: buffer.length,
  };
}

export function validateFontBase64(
  base64: string,
  fileName: string
): UploadValidationResult {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (!FONT_EXTENSIONS.has(ext)) {
    return { ok: false, error: "Only TTF, OTF, WOFF, or WOFF2 fonts are allowed" };
  }

  const buffer = decodeBase64Payload(base64);
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: "Invalid font file data" };
  }
  if (buffer.length > MAX_FONT_BYTES) {
    return { ok: false, error: "Font must be 2MB or smaller" };
  }
  if (!sniffFont(buffer, ext)) {
    return { ok: false, error: "File content is not a valid font" };
  }

  const contentType =
    ext === ".woff2"
      ? "font/woff2"
      : ext === ".woff"
        ? "font/woff"
        : ext === ".otf"
          ? "font/otf"
          : "font/ttf";

  return { ok: true, contentType, sizeBytes: buffer.length };
}
