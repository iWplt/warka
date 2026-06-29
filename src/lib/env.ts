import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  USE_PRISMA_AUTH: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  LOCAL_AUTH_ENABLED: z.enum(["true", "false"]).optional(),
  LOCAL_ADMIN_USERNAME: z.string().min(1).optional(),
  LOCAL_ADMIN_PASSWORD: z.string().min(1).optional(),
  LOCAL_AUTH_SECRET: z.string().min(8).optional(),
  NEXT_PUBLIC_LOCAL_AUTH_ENABLED: z.enum(["true", "false"]).optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  USE_PRISMA_AUTH: process.env.USE_PRISMA_AUTH,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  LOCAL_AUTH_ENABLED: process.env.LOCAL_AUTH_ENABLED,
  LOCAL_ADMIN_USERNAME: process.env.LOCAL_ADMIN_USERNAME,
  LOCAL_ADMIN_PASSWORD: process.env.LOCAL_ADMIN_PASSWORD,
  LOCAL_AUTH_SECRET: process.env.LOCAL_AUTH_SECRET,
  NEXT_PUBLIC_LOCAL_AUTH_ENABLED: process.env.NEXT_PUBLIC_LOCAL_AUTH_ENABLED,
});

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

export function isPrismaAuthEnabled(): boolean {
  return process.env.USE_PRISMA_AUTH === "true";
}
