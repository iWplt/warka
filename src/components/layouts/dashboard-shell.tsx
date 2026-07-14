"use client";



import type { Profile } from "@/types/database";

import { DashboardSidebar } from "./dashboard-sidebar";

import { DashboardHeader } from "./dashboard/dashboard-header";



type DashboardShellProps = {

  profile: Profile;

  children: React.ReactNode;

};



export function DashboardShell({ profile, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-warka-surface font-arabic">
      <DashboardSidebar role={profile.role} profile={profile} />
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">

        <div

          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_100%_0%,rgb(92_98_71/0.06),transparent_50%)]"

          aria-hidden

        />

        <DashboardHeader profile={profile} />

        <main className="relative flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

