/**
 * @param {string} mnemonic Seed phrase of the wallet.
 * @return {string} Normilized mnemonic (trimmed & etc.).
 */
export function normalizeMnemonic(mnemonic: string): string {
  return mnemonic
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join(" ");
}
