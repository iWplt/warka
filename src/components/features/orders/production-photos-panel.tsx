"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Camera, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateProductImageFile } from "@/lib/upload/validate";
import {
  deleteProductionPhoto,
  uploadProductionPhoto,
  type ProductionPhotoView,
} from "@/server/actions/production-photos";

type ProductionPhotosPanelProps = {
  orderId: string;
  photos: ProductionPhotoView[];
  canUpload?: boolean;
  canDelete?: boolean;
};

export function ProductionPhotosPanel({
  orderId,
  photos,
  canUpload = false,
  canDelete = false,
}: ProductionPhotosPanelProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateProductImageFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const result = await uploadProductionPhoto({
        order_id: orderId,
        image_data_url: dataUrl,
        caption: caption.trim() || undefined,
      });
      setCaption("");
      toast.success(
        result.notified
          ? isAr
            ? "تم الرفع وإرسال إشعار للطالب"
            : "Uploaded — student notified"
          : isAr
            ? "تم رفع الصورة"
            : "Photo uploaded"
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isAr ? "فشل الرفع" : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await deleteProductionPhoto(photoId);
      toast.success(isAr ? "تم حذف الصورة" : "Photo deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isAr ? "فشل الحذف" : "Delete failed");
    }
  };

  return (
    <section className="rounded-2xl border border-glass-border glass p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Camera className="size-5 text-primary" aria-hidden />
            {isAr ? "صور الإنتاج" : "Production photos"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr
              ? "ارفع صور المنتج النهائي — يُشعر الطالب عند أول صورة"
              : "Upload finished product photos — student is notified on the first upload"}
          </p>
        </div>
        {canUpload && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={isAr ? "تعليق (اختياري)" : "Caption (optional)"}
              className="max-w-[200px]"
            />
            <Button
              type="button"
              variant="accent"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="size-4" aria-hidden />
              {uploading ? (isAr ? "جاري الرفع…" : "Uploading…") : isAr ? "رفع صورة" : "Upload photo"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isAr ? "لا توجد صور بعد" : "No production photos yet"}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-xl border border-glass-border bg-foreground/5"
            >
              {photo.image_url ? (
                <div className="relative aspect-[4/3] bg-black/5">
                  <Image
                    src={photo.image_url}
                    alt={photo.caption ?? "Production photo"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                  {isAr ? "تعذّر تحميل الصورة" : "Could not load image"}
                </div>
              )}
              <figcaption className="space-y-1 p-3 text-sm">
                {photo.caption && <p className="font-medium">{photo.caption}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(photo.created_at).toLocaleString(locale)}
                  {photo.uploader_name ? ` · ${photo.uploader_name}` : ""}
                </p>
                {canDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="mt-1 gap-1 text-destructive"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {isAr ? "حذف" : "Delete"}
                  </Button>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
