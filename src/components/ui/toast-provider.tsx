"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "glass border-glass-border text-foreground shadow-lg backdrop-blur-xl",
          title: "text-foreground",
          description: "text-muted-foreground",
        },
      }}
      richColors
      closeButton
    />
  );
}
