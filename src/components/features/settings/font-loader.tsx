"use client";

import { useEffect } from "react";
import type { WarkaFont } from "@/lib/settings/types";
import { googleFontsStylesheetUrl, isGoogleFontUrl } from "@/lib/constants/arabic-font-presets";

type FontLoaderProps = {
  fonts: WarkaFont[];
};

function linkIdForFont(font: WarkaFont): string {
  return `warka-font-${font.font_family_css.replace(/\s+/g, "-").toLowerCase()}`;
}

export function FontLoader({ fonts }: FontLoaderProps) {
  useEffect(() => {
    if (!fonts.length || typeof document === "undefined") return;

    const loadedFiles = new Set<string>();

    fonts.forEach((font) => {
      if (!font.file_url) return;

      if (isGoogleFontUrl(font.file_url)) {
        const href = googleFontsStylesheetUrl(font.file_url);
        if (!href) return;
        const id = linkIdForFont(font);
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        link.media = "print";
        link.onload = () => {
          link.media = "all";
        };
        document.head.appendChild(link);
        return;
      }

      if (loadedFiles.has(font.font_family_css)) return;
      loadedFiles.add(font.font_family_css);

      const fontFace = new FontFace(font.font_family_css, `url(${font.file_url})`);
      fontFace
        .load()
        .then((loadedFace) => {
          document.fonts.add(loadedFace);
        })
        .catch(() => {
          /* skip broken font files */
        });
    });
  }, [fonts]);

  return null;
}
