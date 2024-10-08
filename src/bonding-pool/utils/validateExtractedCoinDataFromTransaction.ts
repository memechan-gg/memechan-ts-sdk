import { ExtractedCoinDataFromTransaction } from "../types";

/**
 * Validates the extracted data object to ensure none of the string values are empty.
 * @param {ExtractedCoinDataFromTransaction} data - The extracted data object to validate.
 * @throws {Error} Throws an error if any string value in the object is empty.
 */
export const validateExtractedCoinDataFromTransaction = (data: ExtractedCoinDataFromTransaction): void => {
  validateCoinData("memeCoin", data.memeCoin);
};

/**
 * Validates the coin data object to ensure none of the string values are empty.
 * @param {string} key - The key representing the coin type (memeCoin or ticketCoin).
 * @param {Record<string, string>} coinData - The coin data object to validate.
 * @throws {Error} Throws an error if any string value in the coin data object is empty.
 */
export const validateCoinData = (key: string, coinData: Record<string, string>): void => {
  Object.entries(coinData).forEach(([propKey, propValue]) => {
    if (typeof propValue !== "string" || propValue.trim() === "") {
      throw new Error(`Invalid data for ${key}: ${propKey} is empty or not a string.`);
    }
  });
};
