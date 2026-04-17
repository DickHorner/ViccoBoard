const PLACEHOLDER_PATTERN = /{{\s*([^{}]+?)\s*}}/g;

export type TemplateReplacementValue = string | number | boolean;

export function renderTemplate(
  template: string,
  replacements: Record<string, TemplateReplacementValue | null | undefined>
): string {
  const missingPlaceholders = new Set<string>();

  const rendered = template.replace(PLACEHOLDER_PATTERN, (_match, placeholder: string) => {
    const normalizedPlaceholder = placeholder.trim();
    const replacement = replacements[normalizedPlaceholder];

    if (replacement === undefined || replacement === null) {
      missingPlaceholders.add(normalizedPlaceholder);
      return `{{${normalizedPlaceholder}}}`;
    }

    return String(replacement);
  });

  if (missingPlaceholders.size > 0) {
    throw new Error(
      `Missing template replacements for: ${[...missingPlaceholders].sort().join(', ')}`
    );
  }

  return rendered;
}