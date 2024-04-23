import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CreateCoinTransactionParams } from "../coin/types";

export type ExtractedCoinDataFromTransaction = {
  memeCoin: {
    coinType: string;
    objectId: string;
    objectType: string;
    treasureCapId: string;
    packageId: string;
    metadataObjectId: string;
  };
  ticketCoin: {
    coinType: string;
    objectId: string;
    objectType: string;
    treasureCapId: string;
    packageId: string;
    metadataObjectId: string;
  };
};

export type CreateBondingCurvePoolParams = {
  memeCoin: { treasureCapId: string; metadataObjectId: string; coinType: string };
  ticketCoin: { treasureCapId: string; metadataObjectId: string; coinType: string };
  transaction?: TransactionBlock;
};

export type CreateCoinTransactionParamsWithoutCertainProps = Omit<
  CreateCoinTransactionParams,
  "decimals" | "fixedSupply" | "mintAmount"
>;
