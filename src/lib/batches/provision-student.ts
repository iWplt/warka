import {
  deriveStudentPassword,
  generateStudentAccessCode,
  studentAuthEmail,
} from "@/lib/auth/access-code";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Batch, BatchStudent } from "@/types/database";

export type ProvisionedStudentAccount = {
  userId: string;
  accessCode: string;
  authEmail: string;
  password: string;
};

async function generateUniqueStudentCode(
  admin: NonNullable<ReturnType<typeof createAdminClient>>
): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = generateStudentAccessCode();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("access_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique student access code");
}

export async function provisionBatchStudentAccount(
  batchStudent: Pick<BatchStudent, "id" | "full_name" | "phone" | "student_id">,
  batch: Pick<Batch, "id" | "college" | "department" | "graduation_year">
): Promise<ProvisionedStudentAccount> {
  if (batchStudent.student_id) {
    throw new Error("This student already has a login account");
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin credentials are required to create accounts");
  }

  const accessCode = await generateUniqueStudentCode(admin);
  const authEmail = studentAuthEmail(accessCode);
  const password = deriveStudentPassword(accessCode);

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: batchStudent.full_name,
      role: "student",
      access_code: accessCode,
    },
  });

  if (authError) {
    throw new Error(authError.message || "Failed to create account");
  }

  const userId = authData.user?.id;
  if (!userId) throw new Error("Account was not created");

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "student",
      full_name: batchStudent.full_name,
      phone: batchStudent.phone,
      college: batch.college,
      department: batch.department,
      graduation_year: batch.graduation_year,
      access_code: accessCode,
      is_active: true,
      locale: "ar",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(profileError.message || "Failed to save student profile");
  }

  return { userId, accessCode, authEmail, password };
}

export async function regenerateBatchStudentCredentials(
  userId: string,
  batchStudent: Pick<BatchStudent, "full_name" | "phone">,
  batch: Pick<Batch, "college" | "department" | "graduation_year">
): Promise<ProvisionedStudentAccount> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin credentials are required");
  }

  const accessCode = await generateUniqueStudentCode(admin);
  const authEmail = studentAuthEmail(accessCode);
  const password = deriveStudentPassword(accessCode);

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    email: authEmail,
    password,
    user_metadata: {
      full_name: batchStudent.full_name,
      role: "student",
      access_code: accessCode,
    },
  });

  if (authError) {
    throw new Error(authError.message || "Failed to regenerate credentials");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      access_code: accessCode,
      full_name: batchStudent.full_name,
      phone: batchStudent.phone,
      college: batch.college,
      department: batch.department,
      graduation_year: batch.graduation_year,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message || "Failed to update student profile");
  }

  return { userId, accessCode, authEmail, password };
}
