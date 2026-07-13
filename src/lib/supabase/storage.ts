import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateLogoDataUrl,
  validatePreviewDataUrl,
  validateProductImageDataUrl,
} from "@/lib/upload/validate";
import { logSecurityEvent } from "@/lib/security/audit-log";

export type UploadValidationKind = "logo" | "preview" | "product";

export function parseDataUrl(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
} | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function assertValidDataUrl(dataUrl: string, kind: UploadValidationKind = "logo") {
  const result =
    kind === "product"
      ? validateProductImageDataUrl(dataUrl)
      : kind === "preview"
        ? validatePreviewDataUrl(dataUrl)
        : validateLogoDataUrl(dataUrl);
  if (!result.ok) {
    logSecurityEvent("upload.rejected", { reason: result.error });
    throw new Error(result.error);
  }
}

export async function uploadBuffer(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
  options?: { upsert?: boolean }
): Promise<{ path: string; publicUrl: string | null }> {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: options?.upsert ?? true,
  });
  if (error) throw new Error("Upload failed");

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const isPublic =
    bucket === "designs" ||
    bucket === "qr-codes" ||
    bucket === "templates" ||
    bucket === "product-images" ||
    bucket === "fonts";
  return { path, publicUrl: isPublic ? data.publicUrl : null };
}

export async function uploadDataUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  dataUrl: string,
  options?: { upsert?: boolean; validation?: UploadValidationKind }
): Promise<{ path: string; publicUrl: string | null }> {
  // Always validate — default to logo limits; callers should pass the right kind
  const kind: UploadValidationKind =
    options?.validation ??
    (bucket === "product-images" ? "product" : bucket === "designs" ? "preview" : "logo");
  assertValidDataUrl(dataUrl, kind);
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error("Invalid data URL");
  return uploadBuffer(supabase, bucket, path, parsed.buffer, parsed.contentType, options);
}

export async function removeStorageObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error("Could not remove file");
}
