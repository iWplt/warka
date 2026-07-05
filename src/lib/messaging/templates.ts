import type { TemplateVariables } from "@/lib/messaging/types";

export function renderMessageTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key as keyof TemplateVariables];
    return value ?? match;
  });
}
