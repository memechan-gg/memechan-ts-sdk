/**
 * Extracts the coinType from an ObjectType.
 * @param {string} objectType - The string containing the ObjectType.
 * @return {string} The extracted coinType.
 */
export const extractCoinType = (objectType: string): string => {
  const matches = objectType.match(/<([^>]+)>/);
  if (!matches || matches.length < 2) {
    throw new Error("Invalid object type format.");
  }
  return matches[1];
};
