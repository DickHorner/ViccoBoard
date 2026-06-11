export function normalizeCorrectionImportPayload(parsedItems: unknown[]): unknown | unknown[] {
  const bundles = parsedItems.flatMap((item) => Array.isArray(item) ? item : [item])

  if (bundles.length === 0) {
    throw new Error('Die Importdatei enthält keine Korrekturdaten.')
  }

  return bundles.length === 1 ? bundles[0] : bundles
}
