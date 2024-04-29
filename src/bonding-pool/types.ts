import { ObjectArg } from "@avernikoz/memechan-ts-interface/dist/_framework/util";
import { DynamicFieldInfo, SuiObjectResponse } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CreateCoinTransactionParams } from "../coin/types";
import { NewArgs } from "@avernikoz/memechan-ts-interface/dist/memechan/seed-pool/functions";

export type Optional<T> = {
  [K in keyof T]?: T[K];
};

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

export type BondingCurveCustomParams = Omit<
  NewArgs,
  "registry" | "ticketCoinCap" | "memeCoinCap" | "ticketCoinMetadata" | "memeCoinMetadata"
>;

export type GetBondingCurveCustomParams = Optional<BondingCurveCustomParams>;

export type CreateBondingCurvePoolParams = {
  memeCoin: { treasureCapId: string; metadataObjectId: string; coinType: string };
  ticketCoin: { treasureCapId: string; metadataObjectId: string; coinType: string };
  transaction?: TransactionBlock;
  bondingCurveCustomParams?: BondingCurveCustomParams;
};

export type CreateCoinTransactionParamsWithoutCertainProps = Omit<
  CreateCoinTransactionParams,
  "decimals" | "fixedSupply" | "mintAmount"
>;

export type SwapParamsForSuiInput = {
  memeCoin: { coinType: string };
  ticketCoin: { coinType: string };
  transaction?: TransactionBlock;

  // swap params
  bondingCurvePoolObjectId;
  inputAmount: string;

  slippagePercentage?: number;
};

export type SwapParamsForSuiInputAndTicketOutput = SwapParamsForSuiInput & {
  signerAddress: string;
  minOutputTicketAmount: string;
};

export type SwapParamsForTicketInput = {
  memeCoin: { coinType: string };
  ticketCoin: { coinType: string };
  transaction?: TransactionBlock;

  bondingCurvePoolObjectId;
  inputTicketAmount: string;

  slippagePercentage?: number;
};

export type SwapParamsForTicketInputAndSuiOutput = SwapParamsForTicketInput & {
  signerAddress: string;
  minOutputSuiAmount: string;
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

export interface TokenPolicyCapObjectData extends SuiObjectResponse {
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
        value: {
          type: string;
          fields: {
            for: string;
          };
        };
      };
    };
  };
}

export type ExtractedRegistryKeyData = {
  boundingCurvePackageId: string;
  ticketPackageId: string;
  ticketCoinType: string;
  quotePackageId: string;
  quoteCoinType: string;
  memePackageId: string;
  memeCoinType: string;
};

export interface StakedLpObjectData extends SuiObjectResponse {
  data: {
    objectId: string;
    version: string;
    digest: string;
    type: string;
    content: {
      dataType: "moveObject";
      type: string;
      hasPublicTransfer: boolean;
      fields: {
        balance: string;
        id: {
          id: string;
        };
        until_timestamp: string;
      };
    };
  };
}

export interface StakedLpObject {
  objectId: string;
  type: string;
  balance: string;
  balanceWithDecimals: string;
  untilTimestamp: number;
  ticketCoinType: string;
}
