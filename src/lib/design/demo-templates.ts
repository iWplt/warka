import type { DesignTemplate, ProductType, TemplateConfig } from "@/types/database";

export const DEMO_TEMPLATE_IDS = {
  classicGold: "a1000001-0000-4000-8000-000000000001",
  royalBlue: "a1000001-0000-4000-8000-000000000002",
  elegantBurgundy: "a1000001-0000-4000-8000-000000000003",
  modernEmerald: "a1000001-0000-4000-8000-000000000004",
} as const;

function baseSlots(color: string, accent: string): TemplateConfig["textSlots"] {
  return [
    {
      id: "name",
      x: 200,
      y: 270,
      fontSize: 26,
      fontFamily: "Cairo",
      color: accent,
      maxWidth: 320,
      align: "center",
      field: "full_name",
    },
    {
      id: "department",
      x: 200,
      y: 318,
      fontSize: 16,
      fontFamily: "Cairo",
      color: "#FFFFFF",
      maxWidth: 300,
      align: "center",
      field: "department",
    },
    {
      id: "year",
      x: 200,
      y: 352,
      fontSize: 14,
      fontFamily: "Cairo",
      color: color,
      maxWidth: 200,
      align: "center",
      field: "graduation_year",
    },
    {
      id: "custom",
      x: 200,
      y: 390,
      fontSize: 12,
      fontFamily: "Cairo",
      color: "#E5E7EB",
      maxWidth: 280,
      align: "center",
      field: "custom_text",
    },
  ];
}

function config(bg: string, slotColor: string, accent: string): TemplateConfig {
  return {
    width: 400,
    height: 600,
    backgroundColor: bg,
    textSlots: baseSlots(slotColor, accent),
    logoSlot: { x: 165, y: 88, width: 70, height: 70 },
  };
}

type DemoSeed = {
  id: string;
  product_type: ProductType;
  nameKey: string;
  config: TemplateConfig;
};

const DEMO_SEEDS: DemoSeed[] = [
  {
    id: DEMO_TEMPLATE_IDS.classicGold,
    product_type: "sash",
    nameKey: "classicGold",
    config: config("#0f172a", "#CBD5E1", "#F59E0B"),
  },
  {
    id: DEMO_TEMPLATE_IDS.royalBlue,
    product_type: "sash",
    nameKey: "royalBlue",
    config: config("#1e3a5f", "#93C5FD", "#FDE68A"),
  },
  {
    id: DEMO_TEMPLATE_IDS.elegantBurgundy,
    product_type: "sash",
    nameKey: "elegantBurgundy",
    config: config("#3f1414", "#FCA5A5", "#FCD34D"),
  },
  {
    id: DEMO_TEMPLATE_IDS.modernEmerald,
    product_type: "sash",
    nameKey: "modernEmerald",
    config: config("#064e3b", "#A7F3D0", "#FFFFFF"),
  },
];

export function getDemoTemplates(): DesignTemplate[] {
  const now = new Date().toISOString();
  return DEMO_SEEDS.map((seed) => ({
    id: seed.id,
    product_type: seed.product_type,
    name: seed.nameKey,
    preview_url: null,
    template_url: null,
    template_config: seed.config,
    active: true,
    created_at: now,
  }));
}

export function getDemoTemplateConfigsForSql() {
  return DEMO_SEEDS.map((seed) => ({
    id: seed.id,
    product_type: seed.product_type,
    name: seed.nameKey,
    template_config: seed.config,
  }));
}
