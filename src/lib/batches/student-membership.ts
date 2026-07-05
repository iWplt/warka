import { createClient } from "@/lib/supabase/server";
import type { Batch, BatchStudent } from "@/types/database";
import type { BatchSettings } from "@/lib/settings/types";

export type StudentBatchMembership = {
  batch: Pick<
    Batch,
    "id" | "name" | "college" | "department" | "graduation_year" | "status" | "representative_id" | "settings"
  >;
  roster: BatchStudent;
};

/** Latest batch roster row linked to this student account (if any). */
export async function getStudentBatchMembership(
  studentId: string
): Promise<StudentBatchMembership | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("batch_students")
    .select(
      "*, batches(id, name, college, department, graduation_year, status, representative_id, settings)"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.batches) return null;

  const { batches, ...roster } = data;
  return {
    batch: batches as StudentBatchMembership["batch"],
    roster: roster as BatchStudent,
  };
}

export function batchSettingsFromMembership(
  membership: StudentBatchMembership | null
): BatchSettings | null {
  if (!membership?.batch.settings) return null;
  return membership.batch.settings as BatchSettings;
}
