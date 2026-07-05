"use server";

import { getCurrentProfile } from "@/lib/auth/guards";
import { getMyAddresses } from "@/server/actions/addresses";
import type { Profile, StudentAddress } from "@/types/database";

export type DeliveryDefaults = {
  profile: Pick<Profile, "full_name" | "phone" | "college" | "department">;
  addresses: StudentAddress[];
};

export async function getDeliveryDefaults(): Promise<DeliveryDefaults | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role !== "student" && profile.role !== "representative") return null;

  let addresses: StudentAddress[] = [];
  if (profile.role === "student") {
    try {
      addresses = await getMyAddresses();
    } catch {
      addresses = [];
    }
  }

  return {
    profile: {
      full_name: profile.full_name,
      phone: profile.phone,
      college: profile.college,
      department: profile.department,
    },
    addresses,
  };
}
