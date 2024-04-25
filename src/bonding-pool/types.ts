import { ObjectArg } from "@avernikoz/memechan-ts-interface/dist/_framework/util";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CreateCoinTransactionParams } from "../coin/types";
import { DynamicFieldInfo, SuiObjectResponse } from "@mysten/sui.js/client";

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

export type SwapSuiForTicketParams = {
  memeCoin: { coinType: string };
  ticketCoin: { coinType: string };
  transaction?: TransactionBlock;

  // swap params
  bondingCurvePoolObjectId: ObjectArg;
  inputSuiAmount: string;
  minOutputTicketAmount: string;
};

export interface RegistryTableTypenameDynamicField extends DynamicFieldInfo {
  name: {
    type: string;
    value: {
      name: string;
    };
  };
}

export interface PoolObjectData extends SuiObjectResponse {
  data: {
    type: string;
    version: string;
    objectId: string;
    digest: string;
    content: {
      dataType: "moveObject";
      type: string;
      hasPublicTransfer: boolean;
      fields: {
        id: {
          id: string;
        };
        name: {
          type: string;
          fields: {
            name: string;
          };
        };
        value: string;
      };
    };
  };
}
