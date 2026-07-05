"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentProfile,
  requireAuth,
  requirePermission,
} from "@/lib/auth/guards";
import { createNotification, logActivity } from "@/server/actions/notifications";
import { queueWhatsAppNotification } from "@/lib/messaging/dispatch";
import { uploadDataUrl } from "@/lib/supabase/storage";
import { validateProductImageDataUrl } from "@/lib/upload/validate";
import type { OrderProductionPhoto } from "@/types/database";

export type ProductionPhotoView = OrderProductionPhoto & {
  image_url: string;
  uploader_name: string | null;
};

const uploadSchema = z.object({
  order_id: z.string().uuid(),
  order_item_id: z.string().uuid().optional(),
  image_data_url: z.string().min(1),
  caption: z.string().max(500).optional(),
});

async function assertCanUploadProductionPhotos() {
  const profile = await requireAuth();
  if (profile.role === "admin") return profile;

  if (profile.role === "employee") {
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase not configured");

    const { data: perms } = await supabase
      .from("employee_permissions")
      .select("permission_key, granted")
      .eq("employee_id", profile.id)
      .in("permission_key", ["printing:status", "printing:mark_printed"]);

    const allowed = (perms ?? []).some((p) => p.granted);
    if (allowed) return profile;

    throw new Error("Missing permission to upload production photos");
  }

  throw new Error("Unauthorized");
}

async function assertCanViewOrderPhotos(orderId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("id, student_id, representative_id")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error("Order not found");

  if (profile.role === "admin") return order;
  if (profile.role === "student" && order.student_id === profile.id) return order;
  if (profile.role === "representative" && order.representative_id === profile.id) {
    return order;
  }
  if (profile.role === "employee") {
    await requirePermission("printing:view");
    return order;
  }

  throw new Error("Unauthorized");
}

async function signedUrlForPath(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("production-photos")
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
}

export async function getProductionPhotosForOrder(
  orderId: string
): Promise<ProductionPhotoView[]> {
  await assertCanViewOrderPhotos(orderId);

  const supabase = await createClient();
  if (!supabase) return [];

  const { data: rows } = await supabase
    .from("order_production_photos")
    .select("*, profiles(full_name)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  const photos: ProductionPhotoView[] = [];

  for (const row of rows ?? []) {
    const uploader = row.profiles as { full_name: string } | { full_name: string }[] | null;
    const uploaderName = Array.isArray(uploader) ? uploader[0]?.full_name : uploader?.full_name;
    const imageUrl = await signedUrlForPath(supabase, row.image_path as string);

    photos.push({
      ...(row as OrderProductionPhoto),
      image_url: imageUrl,
      uploader_name: uploaderName ?? null,
    });
  }

  return photos;
}

export async function uploadProductionPhoto(input: z.infer<typeof uploadSchema>) {
  const profile = await assertCanUploadProductionPhotos();
  const data = uploadSchema.parse(input);

  const validation = validateProductImageDataUrl(data.image_data_url);
  if (!validation.ok) throw new Error(validation.error);

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: order } = await supabase
    .from("orders")
    .select("id, student_id, order_number, status")
    .eq("id", data.order_id)
    .single();

  if (!order) throw new Error("Order not found");

  const { count: existingCount } = await supabase
    .from("order_production_photos")
    .select("*", { count: "exact", head: true })
    .eq("order_id", data.order_id);

  const path = `${data.order_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const uploaded = await uploadDataUrl(supabase, "production-photos", path, data.image_data_url, {
    upsert: false,
  });

  const { data: photo, error } = await supabase
    .from("order_production_photos")
    .insert({
      order_id: data.order_id,
      order_item_id: data.order_item_id ?? null,
      image_path: uploaded.path,
      caption: data.caption ?? null,
      uploaded_by: profile.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const isFirstPhoto = (existingCount ?? 0) === 0;

  if (isFirstPhoto && order.student_id) {
    await createNotification(
      order.student_id,
      "production_ready",
      "تم الانتهاء من منتجك",
      "يمكنك مشاهدة صور المنتج الفعلي من صفحة الطلب قبل الاستلام.",
      `/student/orders/${order.id}`,
      "order",
      order.id
    );

    queueWhatsAppNotification({
      eventType: "production_photos_uploaded",
      orderId: order.id,
      studentId: order.student_id,
      variables: {
        order_number: order.order_number as string,
        order_link: `/student/orders/${order.id}`,
      },
    });
  }

  await logActivity(profile.id, "upload_production_photo", "order", data.order_id, {
    photo_id: photo.id,
    first_photo: isFirstPhoto,
  });

  revalidatePath(`/admin/orders/${data.order_id}`);
  revalidatePath(`/student/orders/${data.order_id}`);
  revalidatePath(`/employee/orders/${data.order_id}`);

  return { id: photo.id as string, notified: isFirstPhoto && Boolean(order.student_id) };
}

export async function deleteProductionPhoto(photoId: string) {
  await requirePermission("orders:edit");
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: photo } = await supabase
    .from("order_production_photos")
    .select("id, order_id, image_path")
    .eq("id", photoId)
    .single();

  if (!photo) throw new Error("Photo not found");

  await supabase.storage.from("production-photos").remove([photo.image_path as string]);
  await supabase.from("order_production_photos").delete().eq("id", photoId);

  revalidatePath(`/admin/orders/${photo.order_id}`);
  revalidatePath(`/student/orders/${photo.order_id}`);
  return { success: true };
}
