import { SuiObjectChange } from "@mysten/sui.js/client";
import { BondingPoolSingleton } from "../BondingPool";
import { ExtractedCoinDataFromTransaction } from "../types";
import { validateExtractedCoinDataFromTransaction } from "./validateExtractedCoinDataFromTransaction";
import { extractCoinType } from "./extractCoinType";

export const parseTransactionDataCoinAndTicketCreation = (
  objectChanges: SuiObjectChange[] | null | undefined,
): ExtractedCoinDataFromTransaction => {
  const initialData: ExtractedCoinDataFromTransaction = {
    memeCoin: {
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
      if (change.objectType.includes("0x2::coin::Coin<")) {
        data.memeCoin.objectId = objectInfo.objectId;
        data.memeCoin.objectType = objectInfo.objectType;
      } else if (change.objectType.includes("0x2::coin::TreasuryCap<")) {
        data.memeCoin.treasureCapId = objectInfo.objectId;
      } else if (change.objectType.includes("0x2::coin::CoinMetadata<")) {
        data.memeCoin.metadataObjectId = objectInfo.objectId;
      }
    } else if (change.type === "published") {
      data.memeCoin.packageId = change.packageId;
    }
    return data;
  }, initialData);

  const memeCoinType = extractCoinType(data.memeCoin.objectType);
  const dataWithCoinTypes = {
    ...data,
    memeCoin: { ...data.memeCoin, coinType: memeCoinType },
  };

  validateExtractedCoinDataFromTransaction(dataWithCoinTypes);

  return dataWithCoinTypes;
};
