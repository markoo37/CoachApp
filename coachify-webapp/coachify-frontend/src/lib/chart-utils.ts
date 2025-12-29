/**
 * Select evenly spaced items from an array
 * @param items - Array of items to select from
 * @param count - Number of items to select
 * @returns Array of evenly spaced items
 */
export function selectEvenlySpacedItems<T>(items: T[], count: number): T[] {
  if (items.length === 0 || count <= 0) return [];
  if (items.length <= count) return items;
  
  const result: T[] = [];
  const step = (items.length - 1) / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const index = Math.round(i * step);
    result.push(items[index]);
  }
  
  return result;
}

