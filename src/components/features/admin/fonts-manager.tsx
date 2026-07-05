"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createFontRecord,
  deleteFont,
  reorderFonts,
  seedArabicFontPresets,
  updateFont,
  uploadFontFile,
} from "@/server/actions/fonts";
import type { WarkaFont } from "@/lib/settings/types";
import { isGoogleFontUrl } from "@/lib/constants/arabic-font-presets";
import { cn } from "@/lib/utils";

type FontsManagerProps = {
  fonts: WarkaFont[];
};

export function FontsManager({ fonts: initialFonts }: FontsManagerProps) {
  const router = useRouter();
  const [fonts, setFonts] = useState(initialFonts);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const usingPresetsOnly = fonts.every((f) => f.id.startsWith("preset-"));
  const [draft, setDraft] = useState({
    name_ar: "",
    name_en: "",
    font_family_css: "",
    category: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = fonts.findIndex((f) => f.id === active.id);
      const newIndex = fonts.findIndex((f) => f.id === over.id);
      if (fonts[oldIndex]?.id.startsWith("preset-")) return;
      const reordered = arrayMove(fonts, oldIndex, newIndex);
      setFonts(reordered);

      try {
        await reorderFonts(reordered.map((f) => f.id));
        router.refresh();
      } catch {
        setFonts(initialFonts);
        toast.error("Could not reorder fonts");
      }
    },
    [fonts, initialFonts, router]
  );

  const handleCreate = async () => {
    if (!draft.name_ar || !draft.font_family_css) {
      toast.error("Arabic name and CSS family are required");
      return;
    }
    setCreating(true);
    try {
      await createFontRecord({
        name_ar: draft.name_ar,
        name_en: draft.name_en || undefined,
        font_family_css: draft.font_family_css,
        category: draft.category || undefined,
      });
      toast.success("Font created — upload a .woff2 file next");
      setDraft({ name_ar: "", name_en: "", font_family_css: "", category: "" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpload = async (fontId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        await uploadFontFile(fontId, dataUrl, file.name);
        toast.success("Font file uploaded");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleActive = async (font: WarkaFont) => {
    try {
      await updateFont(font.id, { is_active: !font.is_active });
      router.refresh();
    } catch {
      toast.error("Error");
    }
  };

  const handleSeedPresets = async () => {
    setSeeding(true);
    try {
      const result = await seedArabicFontPresets();
      toast.success(
        result.inserted > 0
          ? `تمت إضافة ${result.inserted} خط (${result.skipped} موجود مسبقاً)`
          : "كل الخطوط العربية موجودة مسبقاً"
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("preset-")) {
      toast.error("اضغط «تثبيت الخطوط العربية» أولاً");
      return;
    }
    if (!confirm("Delete this font?")) return;
    try {
      await deleteFont(id);
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">الخطوط العربية الشائعة</p>
            <p className="mt-1 text-sm text-muted-foreground">
              نقش ثلث، نسخ، ديواني، رقعة، كوفي، فارسي — جاهزة من Google Fonts بدون رفع ملفات.
            </p>
          </div>
          <Button type="button" variant="accent" disabled={seeding} onClick={() => void handleSeedPresets()}>
            {seeding ? "جاري التثبيت…" : usingPresetsOnly ? "تثبيت الخطوط العربية" : "إضافة الخطوط الناقصة"}
          </Button>
        </div>
        {usingPresetsOnly && (
          <p className="mt-2 text-xs text-amber-700">
            المعاينة من القائمة المدمجة — اضغط «تثبيت» لحفظها في قاعدة البيانات.
          </p>
        )}
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-4 font-semibold">Add font</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            placeholder="Arabic name"
            className="rounded-xl border border-glass-border bg-card px-4 py-2"
            value={draft.name_ar}
            onChange={(e) => setDraft((d) => ({ ...d, name_ar: e.target.value }))}
          />
          <input
            placeholder="English name"
            className="rounded-xl border border-glass-border bg-card px-4 py-2"
            value={draft.name_en}
            onChange={(e) => setDraft((d) => ({ ...d, name_en: e.target.value }))}
          />
          <input
            placeholder="CSS family (e.g. diwani-thuluth)"
            className="rounded-xl border border-glass-border bg-card px-4 py-2 font-mono text-sm"
            value={draft.font_family_css}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                font_family_css: e.target.value.toLowerCase().replace(/\s+/g, "-"),
              }))
            }
          />
          <input
            placeholder="Category (ثلث، ديواني…)"
            className="rounded-xl border border-glass-border bg-card px-4 py-2"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          />
        </div>
        <Button className="mt-4" onClick={() => void handleCreate()} disabled={creating}>
          <Plus className="size-4" />
          {creating ? "Creating…" : "Create font"}
        </Button>
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="mb-2 font-semibold">Fonts ({fonts.length})</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Drag to reorder. Order matches the live preview shown to students.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fonts.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {fonts.map((font) => (
                <SortableFontRow
                  key={font.id}
                  font={font}
                  onToggleActive={() => void handleToggleActive(font)}
                  onDelete={() => void handleDelete(font.id)}
                  onUpload={(file) => void handleUpload(font.id, file)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableFontRow({
  font,
  onToggleActive,
  onDelete,
  onUpload,
}: {
  font: WarkaFont;
  onToggleActive: () => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: font.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-glass-border bg-card p-3",
        isDragging && "opacity-80 shadow-lg",
        !font.is_active && "opacity-60"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-foreground/5"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-medium">{font.name_ar}</p>
        <p className="font-mono text-xs text-muted-foreground">{font.font_family_css}</p>
        {isGoogleFontUrl(font.file_url) ? (
          <p className="text-xs text-primary">Google Fonts — جاهز</p>
        ) : font.file_url ? (
          <p className="truncate text-xs text-muted-foreground">{font.file_url}</p>
        ) : (
          <p className="text-xs text-amber-600">No font file uploaded yet</p>
        )}
      </div>

      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium hover:bg-foreground/5">
        <Upload className="size-3.5" />
        Upload
        <input
          type="file"
          accept=".woff2,.woff,.ttf,.otf"
          className="sr-only"
          disabled={isGoogleFontUrl(font.file_url)}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </label>

      <Button size="sm" variant="ghost" onClick={onToggleActive}>
        {font.is_active ? "Disable" : "Enable"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete}>
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
