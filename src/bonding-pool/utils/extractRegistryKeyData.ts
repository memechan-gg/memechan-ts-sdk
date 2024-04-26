import { normalizeSuiAddress } from "@mysten/sui.js/utils";
import { ExtractedRegistryKeyData } from "../types";

/**
 * Extracts packageId, ticketPackageId, and ticketCoinType from a RegistryKey typename string.
 * @param {string} typename - The RegistryKey typename string.
 * @return {ExtractedRegistryKeyData} - An object containing packageId, ticketPackageId, and ticketCoinType.
 */
export function extractRegistryKeyData(typename: string): ExtractedRegistryKeyData {
  const [packageId, rest] = typename.split("::index::RegistryKey<");
  if (!rest) {
    throw new Error("Invalid typename format. Expected '::index::RegistryKey' pattern.");
  }

  const [boundingCurvePoolType, ticketCoinType, quoteCoinTypeRaw] = rest.split(",");
  if (!ticketCoinType) {
    throw new Error("Invalid typename format. Missing ticketCoinType.");
  }

  const [quoteCoinTypeDenormalized] = quoteCoinTypeRaw.split(">");
  const quoteCoinTypeParts = quoteCoinTypeDenormalized.split("::");
  if (quoteCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid quoteCoinTypeDenormalized format.");
  }
  const normalizedQuoteCoinPackageId = normalizeSuiAddress(quoteCoinTypeParts[0]);
  // Join the normalized parts to form the final ticketCoinType
  const normalizedQuoteCoinType = `${normalizedQuoteCoinPackageId}::${quoteCoinTypeParts.slice(1).join("::")}`;

  // Normalize the packageId and part of the ticketCoinType
  const normalizedPackageId = normalizeSuiAddress(packageId);
  const ticketCoinTypeParts = ticketCoinType.split("::");
  if (ticketCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid ticketCoinType format.");
  }
  const normalizedTicketCoinPackageId = normalizeSuiAddress(ticketCoinTypeParts[0]);

  // Join the normalized parts to form the final ticketCoinType
  const normalizedTicketCoinType = `${normalizedTicketCoinPackageId}::${ticketCoinTypeParts.slice(1).join("::")}`;

  return {
    boundingCurvePackageId: normalizedPackageId,
    boundingCurvePoolType,
    ticketPackageId: normalizedTicketCoinPackageId,
    ticketCoinType: normalizedTicketCoinType,
    quotePackageId: normalizedQuoteCoinPackageId,
    quoteCoinType: normalizedQuoteCoinType,
  };
}
