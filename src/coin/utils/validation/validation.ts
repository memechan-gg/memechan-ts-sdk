import BigNumber from "bignumber.js";

/**
 * Validates the coin name to be a non-empty string.
 *
 * @param {string} coinName - The coin name to validate.
 * @return {boolean} - Returns true if the coin name is valid, otherwise false.
 */
export function validateCoinName(coinName: string): boolean {
  const regex = /^[a-zA-Z0-9\s]+$/;
  return typeof coinName === "string" && coinName.trim() !== "" && regex.test(coinName);
}

/**
 * Validates the coin symbol based on the specified pattern.
 *
 * @param {string} coinSymbol - The coin symbol to validate.
 * @return {boolean} - Returns true if the coin symbol is valid, otherwise false.
 */
export function validateCoinSymbol(coinSymbol: string): boolean {
  const regex = /^[a-zA-Z_]+$/;
  const isCoinSymbolIsValid = typeof coinSymbol === "string" && regex.test(coinSymbol);

  return isCoinSymbolIsValid;
}

/**
 * Validates the coin description to be a string.
 *
 * @param {string} coinDescription - The coin description to validate.
 * @return {boolean} - Returns true if the coin description is a string, otherwise false.
 */
export function validateCoinDescription(coinDescription: string): boolean {
  return typeof coinDescription === "string";
}

/**
 * Validates the coin decimals based on the specified pattern.
 *
 * @param {string} coinDecimals - The coin decimals to validate (as a string).
 * @return {boolean} - Returns true if the coin decimals are a valid integer, otherwise false.
 */
export function validateCoinDecimals(coinDecimals: string): boolean {
  // Convert the string to an integer
  const decimalsAsInt = parseInt(coinDecimals, 10);

  // Check if the conversion is successful and perform the validations
  return (
    typeof decimalsAsInt === "number" &&
    !isNaN(decimalsAsInt) &&
    decimalsAsInt >= 0 &&
    decimalsAsInt <= 11 &&
    decimalsAsInt === Math.floor(decimalsAsInt)
  );
}

/**
 * Calculate the maximum total supply based on decimals.
 *
 * @param {number} decimals - The number of decimals for the token.
 * @return {BigNumber} The maximum total supply.
 */
export function calculateMaxTotalSupply(decimals: string): BigNumber {
  const pow = 19 - parseInt(decimals);
  const output = new BigNumber(10).pow(pow).minus(1);

  return output;
}

/**
 * Validates the total supply to be a string containing only numbers and not exceeding the specified maxTotalSupply.
 *
 * @param {string} totalSupply - The total supply to validate.
 * @param {number} decimals - The number of decimals for the token.
 * @return {boolean} - Returns true if the total supply is a string containing only numbers and
 * does not exceed or equal maxTotalSupply, otherwise false.
 */
export function validateTotalSupply(totalSupply: string, decimals: string): boolean {
  if (typeof totalSupply !== "string" || !/^\d+$/.test(totalSupply)) {
    return false; // Return false if totalSupply is not a string containing only numbers
  }

  const totalSupplyBigNumber = new BigNumber(totalSupply);
  const maxTotalSupply = calculateMaxTotalSupply(decimals);
  const isTotalSupplyIsValid = totalSupplyBigNumber.isLessThanOrEqualTo(maxTotalSupply);

  return isTotalSupplyIsValid;
}

/**
 * Validates a parameter intended for use as an image of a coin.
 *
 * @param {string} coinImage - The value to be validated as a coin image.
 * @return {boolean} Returns true if the coinImage is valid, otherwise false.
 *
 * @description
 * This function validates the `coinImage` parameter to ensure it meets the criteria for an acceptable coin image.
 * The validation process includes:
 * - Checking if the `coinImage` parameter is an empty string, which is allowed.
 * - Verifying if the `coinImage` parameter matches either a base64-encoded string or a valid URL format.
 */
export function validateCoinImage(coinImage: string): boolean {
  const base64ImageRegex = /^data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/]+={0,2})$/;
  const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

  return coinImage === "" || base64ImageRegex.test(coinImage) || urlRegex.test(coinImage);
}
