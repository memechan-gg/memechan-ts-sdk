import { SuiObjectChange } from "@mysten/sui.js/client";
import { BondingPoolSingleton } from "../BondingPool";
import { ExtractedCoinDataFromTransaction } from "../types";
import { validateCoinData, validateExtractedCoinDataFromTransaction } from "./validateExtractedCoinDataFromTransaction";
import { extractCoinType } from "./extractCoinType";

export const parseTransactionDataLpCoinCreation = (objectChanges: SuiObjectChange[] | null | undefined) => {
  const initialData = {
    lpCoin: {
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
      if (change.objectType.includes(`${BondingPoolSingleton.LP_COIN_MODULE_PREFIX}`)) {
        if (change.objectType.includes("0x2::coin::Coin<")) {
          data.lpCoin.objectId = objectInfo.objectId;
          data.lpCoin.objectType = objectInfo.objectType;
        } else if (change.objectType.includes("0x2::coin::TreasuryCap<")) {
          data.lpCoin.treasureCapId = objectInfo.objectId;
        } else if (change.objectType.includes("0x2::coin::CoinMetadata<")) {
          data.lpCoin.metadataObjectId = objectInfo.objectId;
        }
      }
    } else if (change.type === "published") {
      const isPublishedTicket = change.modules?.some((module) =>
        module.includes(`${BondingPoolSingleton.LP_COIN_MODULE_PREFIX}`),
      );
      if (isPublishedTicket) {
        data.lpCoin.packageId = change.packageId;
      } else {
        data.lpCoin.packageId = change.packageId;
      }
    }
    return data;
  }, initialData);

  const lpCoinType = extractCoinType(data.lpCoin.objectType);
  const dataWithCoinTypes = {
    ...data,
    lpCoin: { ...data.lpCoin, coinType: lpCoinType },
  };

  validateCoinData("lpCoin", dataWithCoinTypes.lpCoin);

  return dataWithCoinTypes;
};
