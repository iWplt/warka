"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-2xl glass p-8 text-center">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "The page failed to load. Try again or return to the dashboard."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="accent">
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.assign("/en/admin")}>
          Dashboard
        </Button>
      </div>
    </div>
  );
}
