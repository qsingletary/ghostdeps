/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * Returns early with `maxDistance + 1` once it's clear the true distance
 * exceeds `maxDistance`. The early bailout makes typosquat scanning fast
 * across hundreds of comparison candidates.
 */
export function levenshtein(a: string, b: string, maxDistance = Infinity): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  if (Math.abs(a.length - b.length) > maxDistance) {
    return maxDistance + 1;
  }

  let previous = new Array<number>(b.length + 1);
  let current = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) previous[j] = j;

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    let rowMin = current[0]!;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const insertion = current[j - 1]! + 1;
      const deletion = previous[j]! + 1;
      const substitution = previous[j - 1]! + cost;
      current[j] = Math.min(insertion, deletion, substitution);
      if (current[j]! < rowMin) rowMin = current[j]!;
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    [previous, current] = [current, previous];
  }

  return previous[b.length]!;
}
