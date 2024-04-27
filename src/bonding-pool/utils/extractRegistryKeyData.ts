import { normalizeSuiAddress } from "@mysten/sui.js/utils";
import { ExtractedRegistryKeyData } from "../types";

/**
 * Extracts packageId, ticketPackageId, and ticketCoinType from a RegistryKey typename string.
 * @param {string} typename - The RegistryKey typename string.
 * @return {ExtractedRegistryKeyData} - An object containing packageId, ticketPackageId, and ticketCoinType.
 */
export function extractRegistryKeyData(typename: string): ExtractedRegistryKeyData {
  const [packageId, rest] = typename.split("::index::RegistryKey<");
  const normalizedPackageId = normalizeSuiAddress(packageId);

  if (!rest) {
    throw new Error("Invalid typename format. Expected '::index::RegistryKey' pattern.");
  }

  const [ticketCoinType, quoteCoinType, memeCoinTypeRaw] = rest.split(",");
  if (!ticketCoinType) {
    throw new Error("Invalid typename format. Missing ticketCoinType.");
  }

  if (!memeCoinTypeRaw) {
    throw new Error("Invalid typename format. Missing memeCoinType.");
  }

  // Ticket (base)
  const ticketCoinTypeParts = ticketCoinType.split("::");
  if (ticketCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid ticketCoinType format.");
  }
  const normalizedTicketCoinPackageId = normalizeSuiAddress(ticketCoinTypeParts[0]);
  const normalizedTicketCoinType = `${normalizedTicketCoinPackageId}::${ticketCoinTypeParts.slice(1).join("::")}`;

  // Sui (quote)
  const quoteCoinTypeParts = quoteCoinType.split("::");
  if (quoteCoinTypeParts.length < 2) {
    throw new Error("Invalid typename format. Invalid quoteCoinTypeDenormalized format.");
  }
  const normalizedQuoteCoinPackageId = normalizeSuiAddress(quoteCoinTypeParts[0]);
  const normalizedQuoteCoinType = `${normalizedQuoteCoinPackageId}::${quoteCoinTypeParts.slice(1).join("::")}`;

  // Meme
  const [memeCoinTypeDenormalized] = memeCoinTypeRaw.split(">");
  const memeCoinTypeParts = memeCoinTypeDenormalized.split("::");
  const normalizedMemePackageId = normalizeSuiAddress(memeCoinTypeParts[0]);
  const memeCoinType = `${normalizedMemePackageId}::${memeCoinTypeParts.slice(1).join("::")}`;

  return {
    boundingCurvePackageId: normalizedPackageId,
    ticketPackageId: normalizedTicketCoinPackageId,
    ticketCoinType: normalizedTicketCoinType,
    quotePackageId: normalizedQuoteCoinPackageId,
    quoteCoinType: normalizedQuoteCoinType,
    memePackageId: normalizedMemePackageId,
    memeCoinType,
  };
}
