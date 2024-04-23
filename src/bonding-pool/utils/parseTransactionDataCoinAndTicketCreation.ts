import { SuiObjectChange } from "@mysten/sui.js/client";
import { BondingPoolSingleton } from "../BondingPool";
import { ExtractedData } from "../types";
import { validateExtractedData } from "./validateExtractedData";
import { extractCoinType } from "./extractCoinType";

export const parseTransactionDataCoinAndTicketCreation = (
  objectChanges: SuiObjectChange[] | null | undefined,
): ExtractedData => {
  const initialData: ExtractedData = {
    memeCoin: {
      coinType: "",
      objectId: "",
      objectType: "",
      treasureCapId: "",
      packageId: "",
      metadataObjectId: "",
    },
    ticketCoin: {
      coinType: "",
      objectId: "",
      objectType: "",
      treasureCapId: "",
      packageId: "",
      metadataObjectId: "",
    },
  };

  if (!objectChanges) {
    throw new Error("Invalid object changes shape of data");
  }

  const data = objectChanges.reduce((data, change) => {
    if (change.type === "created" && change.objectId && change.objectType) {
      const objectInfo = { objectId: change.objectId, objectType: change.objectType };
      if (change.objectType.includes(`${BondingPoolSingleton.TICKET_COIN_MODULE_PREFIX}`)) {
        if (change.objectType.includes("0x2::coin::Coin<")) {
          data.ticketCoin.objectId = objectInfo.objectId;
          data.ticketCoin.objectType = objectInfo.objectType;
        } else if (change.objectType.includes("0x2::coin::TreasuryCap<")) {
          data.ticketCoin.treasureCapId = objectInfo.objectId;
        } else if (change.objectType.includes("0x2::coin::CoinMetadata<")) {
          data.ticketCoin.metadataObjectId = objectInfo.objectId;
        }
      } else {
        if (change.objectType.includes("0x2::coin::Coin<")) {
          data.memeCoin.objectId = objectInfo.objectId;
          data.memeCoin.objectType = objectInfo.objectType;
        } else if (change.objectType.includes("0x2::coin::TreasuryCap<")) {
          data.memeCoin.treasureCapId = objectInfo.objectId;
        } else if (change.objectType.includes("0x2::coin::CoinMetadata<")) {
          data.memeCoin.metadataObjectId = objectInfo.objectId;
        }
      }
    } else if (change.type === "published") {
      const isPublishedTicket = change.modules?.some((module) =>
        module.includes(`${BondingPoolSingleton.TICKET_COIN_MODULE_PREFIX}`),
      );
      if (isPublishedTicket) {
        data.ticketCoin.packageId = change.packageId;
      } else {
        data.memeCoin.packageId = change.packageId;
      }
    }
    return data;
  }, initialData);

  const memeCoinType = extractCoinType(data.memeCoin.objectType);
  const ticketCoinType = extractCoinType(data.ticketCoin.objectType);
  const dataWithCoinTypes = {
    ...data,
    memeCoin: { ...data.memeCoin, coinType: memeCoinType },
    ticketCoin: { ...data.ticketCoin, coinType: ticketCoinType },
  };

  validateExtractedData(dataWithCoinTypes);

  return dataWithCoinTypes;
};
