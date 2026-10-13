/**
 * Array reordering and section order normalization utilities.
 * Edge-compliant, immutable.
 */

/**
 * Immutably moves an item from one index to another in an array.
 * If indices are equal or out of bounds, returns a shallow copy.
 */
export function arrayMove<T>(array: readonly T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= result.length ||
    toIndex < 0 ||
    toIndex >= result.length
  ) {
    return result;
  }

  const [item] = result.splice(fromIndex, 1);
  if (item !== undefined) {
    result.splice(toIndex, 0, item);
  }
  return result;
}

/**
 * Normalizes sectionOrder:
 * 1. Drops duplicate IDs and IDs that do not exist in knownSectionIds.
 * 2. Appends any knownSectionIds that are missing from order.
 * Ensures every valid section is represented exactly once in the order.
 */
export function normalizeSectionOrder(
  order: readonly string[],
  knownSectionIds: readonly string[]
): string[] {
  const knownSet = new Set(knownSectionIds);
  const seen = new Set<string>();
  const normalized: string[] = [];

  // 1. Keep known IDs in their existing order, dropping duplicates and unknown IDs
  for (const id of order) {
    if (knownSet.has(id) && !seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  }

  // 2. Append any missing known IDs
  for (const id of knownSectionIds) {
    if (!seen.has(id)) {
      seen.add(id);
      normalized.push(id);
    }
  }

  return normalized;
}
