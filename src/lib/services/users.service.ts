import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors/api-error";
import type { Role, Prisma } from "@prisma/client";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { student: true; representative: true };
}>;

/**
 * Finds a user by email (case-insensitive).
 */
export async function findUserByEmail(
  email: string
): Promise<UserWithRelations | null> {
  try {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { student: true, representative: true },
    });
  } catch {
    throw new ApiError(
      "Failed to load user",
      500,
      "USER_FETCH_FAILED"
    );
  }
}

/**
 * Lists users, optionally filtered by role (admin only).
 */
export async function listUsers(role?: Role) {
  try {
    return await prisma.user.findMany({
      where: role ? { role } : undefined,
      include: { student: true, representative: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    throw new ApiError("Failed to list users", 500, "USER_LIST_FAILED");
  }
}

/**
 * Returns a sanitized user record without password hash.
 */
export function sanitizeUser(user: UserWithRelations) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = user;
  return safe;
}
