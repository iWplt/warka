import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors/api-error";
import type { DesignTemplateType } from "@prisma/client";

/**
 * Lists active design templates, optionally filtered by product type.
 */
export async function listDesignTemplates(type?: DesignTemplateType) {
  try {
    return await prisma.designTemplate.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    throw new ApiError(
      "Failed to load design templates",
      500,
      "TEMPLATE_LIST_FAILED"
    );
  }
}

/**
 * Returns a single design template by id.
 */
export async function getDesignTemplateById(id: string) {
  try {
    const template = await prisma.designTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new ApiError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }
    return template;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Failed to load design template",
      500,
      "TEMPLATE_FETCH_FAILED"
    );
  }
}

/**
 * Lists active product prices from the catalog.
 */
export async function listActivePrices() {
  try {
    return await prisma.price.findMany({
      where: { isActive: true },
      orderBy: { productType: "asc" },
    });
  } catch {
    throw new ApiError("Failed to load prices", 500, "PRICE_LIST_FAILED");
  }
}
