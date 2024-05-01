import { normalizeSuiAddress } from "@mysten/sui.js/utils";
import { ExtractedRegistryKeyData } from "../types";

/**
 * Extracts data from a RegistryKey typename string.
 * @param {string} typename - The RegistryKey typename string.
 * @return {ExtractedRegistryKeyData} - An object containing extracted data (memeCoin, quoteCoin, packageIds)
 */
export function extractRegistryKeyData(typename: string): ExtractedRegistryKeyData {
  const [packageId, rest] = typename.split("::index::RegistryKey<");
  const normalizedPackageId = normalizeSuiAddress(packageId);

  if (!rest) {
    throw new Error("Invalid typename format. Expected '::index::RegistryKey' pattern.");
  }

  const [quoteCoinType, memeCoinType] = rest.split(",");
  if (!quoteCoinType) {
    throw new Error("Invalid typename format. Missing quoteCoinType.");
  }

  if (!memeCoinType) {
    throw new Error("Invalid typename format. Missing memeCoinType.");
  }

  // Sui (quote)
  const quoteCoinTypeParts = quoteCoinType.split("::");
  if (quoteCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid quoteCoinTypeDenormalized format.");
  }
  const normalizedQuoteCoinPackageId = normalizeSuiAddress(quoteCoinTypeParts[0]);
  const normalizedQuoteCoinType = `${normalizedQuoteCoinPackageId}::${quoteCoinTypeParts.slice(1).join("::")}`;

  // Meme (base)
  const memeCoinTypeParts = memeCoinType.split("::");
  if (memeCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid memeCoinType format.");
  }
  const normalizedMemeCoinPackageId = normalizeSuiAddress(memeCoinTypeParts[0]);
  const normalizedMemeCoinType = `${normalizedMemeCoinPackageId}::${memeCoinTypeParts.slice(1).join("::")}`;

  return {
    boundingCurvePackageId: normalizedPackageId,
    quotePackageId: normalizedQuoteCoinPackageId,
    quoteCoinType: normalizedQuoteCoinType,
    memePackageId: normalizedMemeCoinPackageId,
    memeCoinType: normalizedMemeCoinType,
  };
}
