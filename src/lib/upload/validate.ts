const MAX_PRODUCT_IMAGE_BYTES = 15 * 1024 * 1024;

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

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 5 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export type UploadValidationResult =
  | { ok: true; contentType: string; sizeBytes: number }
  | { ok: false; error: string };

export function validateImageDataUrl(
  dataUrl: string,
  maxBytes: number
): UploadValidationResult {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "Invalid image data" };
  }

  const contentType = match[1].toLowerCase();
  if (!IMAGE_MIME_TYPES.has(contentType)) {
    return { ok: false, error: "Only PNG, JPEG, WebP, or GIF images are allowed" };
  }

  const sizeBytes = Math.ceil((match[2].length * 3) / 4);
  if (sizeBytes > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `File exceeds ${mb}MB limit` };
  }

  return { ok: true, contentType, sizeBytes };
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

const MAX_EXCEL_BYTES = 5 * 1024 * 1024;
const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

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
  const sizeBytes = Math.ceil((base64File.length * 3) / 4);
  if (sizeBytes > MAX_EXCEL_BYTES) {
    return { ok: false, error: "Excel file must be 5MB or smaller" };
  }
  return { ok: true, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes };
}
