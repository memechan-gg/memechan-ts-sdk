import { CreateCoinExternalApiResType } from "./types";

/**
 * Validates whether the provided response object adheres to the expected structure for creating a coin.
 *
 * @param {unknown} res - The object to validate.
 * @return {CreateCoinExternalApiResType} True if the object has a valid structure for creating a coin, false otherwise.
 */
export function isValidResForCreateCoin(res: unknown): res is CreateCoinExternalApiResType {
  return (
    typeof res === "object" &&
    res !== null &&
    "modules" in res &&
    "dependencies" in res &&
    "digest" in res &&
    Array.isArray(res.modules) &&
    (res.modules.every((m: unknown) => typeof m === "string") ||
      res.modules.every((m: unknown) => Array.isArray(m) && m.every((n: unknown) => typeof n === "number"))) &&
    Array.isArray(res.dependencies) &&
    res.dependencies.every((d: unknown) => typeof d === "string") &&
    Array.isArray(res.digest) &&
    res.digest.every((n: unknown) => typeof n === "number")
  );
}
