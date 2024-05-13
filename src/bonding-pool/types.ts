import { DynamicFieldInfo, SuiObjectResponse } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CreateCoinTransactionParams } from "../coin/types";
import { NewArgs } from "@avernikoz/memechan-ts-interface/dist/memechan/seed-pool/functions";
import { GoLiveArgs, GoLiveDefaultArgs } from "@avernikoz/memechan-ts-interface/dist/memechan/go-live/functions";
import { ObjectArg } from "@avernikoz/memechan-ts-interface/dist/_framework/util";

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
};

export type BondingCurveCustomParams = Omit<
  NewArgs,
  "registry" | "ticketCoinCap" | "memeCoinCap" | "ticketCoinMetadata" | "memeCoinMetadata"
>;

export type GetBondingCurveCustomParams = Optional<BondingCurveCustomParams>;

export type CreateBondingCurvePoolParams = {
  memeCoin: { treasureCapId: string; metadataObjectId: string; coinType: string };
  transaction?: TransactionBlock;
  bondingCurveCustomParams?: BondingCurveCustomParams;
};

export type CreateCoinTransactionParamsWithoutCertainProps = Omit<
  CreateCoinTransactionParams,
  "decimals" | "fixedSupply" | "mintAmount"
>;

export type SwapParamsForSuiInput = {
  memeCoin: { coinType: string };
  transaction?: TransactionBlock;

  // swap params
  bondingCurvePoolObjectId: string;
  inputAmount: string;

  slippagePercentage?: number;
};

export type SwapParamsForSuiInputAndTicketOutput = SwapParamsForSuiInput & {
  signerAddress: string;
  minOutputTicketAmount: string;
};

export type SwapParamsForTicketInput = {
  memeCoin: { coinType: string };
  transaction?: TransactionBlock;

  bondingCurvePoolObjectId: string;
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
  memeCoinType: string;
}

export interface DetailedPoolInfo extends SuiObjectResponse {
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
        accounting: {
          type: string;
          fields: {
            id: {
              id: string;
            };
            size: string;
          };
        };
        admin_balance_m: string;
        admin_balance_s: string;
        balance_m: string;
        balance_s: string;
        fees: {
          type: string;
          fields: {
            fee_in_percent: string;
            fee_out_percent: string;
          };
        };
        id: {
          id: string;
        };
        launch_balance: string;
        locked: boolean;
        meme_cap: {
          type: string;
          fields: {
            id: {
              id: string;
            };
            total_supply: {
              type: string;
              fields: {
                value: string;
              };
            };
          };
        };
        params: {
          type: string;
          fields: {
            alpha_abs: string;
            beta: string;
            gamma_m: string;
            gamma_s: string;
            omega_m: string;
            price_factor: string;
            sell_delay_ms: string;
          };
        };
        policy_cap: {
          type: string;
          fields: {
            for: string;
            id: {
              id: string;
            };
          };
        };
      };
    };
  };
}

export type InitSecondaryMarketParams = {
  suiMetadataObject: ObjectArg;
  lpCoinTreasureCapId: ObjectArg;
  memeCoinType: string;
  lpCoinType: string;

  transaction?: TransactionBlock;
} & Omit<GoLiveDefaultArgs, "suiMeta" | "treasuryCap" | "clock">;

export type InitSecondaryMarketCustomParams = {
  suiMetadataObject: ObjectArg;
  lpCoinTreasureCapId: ObjectArg;
  memeCoinType: string;
  lpCoinType: string;

  transaction?: TransactionBlock;
} & Omit<GoLiveArgs, "suiMeta" | "treasuryCap" | "clock">;

export type ObjectIdsByAddressMapType = { [address: string]: string };

export interface VestingDataInfo extends SuiObjectResponse {
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
        name: string;
        value: {
          type: string;
          fields: {
            notional: string;
            released: string;
          };
        };
      };
    };
  };
}

export interface StakingPoolTokenPolicyCap extends SuiObjectResponse {
  data: {
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
        policy_cap: {
          fields: {
            for: string;
          };
        };
      };
    };
  };
}

export type PoolWithDetailedInfoType = ExtractedRegistryKeyData & {
  objectId: string;
  typename: string;
  detailedPoolInfo?: DetailedPoolInfo;
};

export type GetAllPoolsMapByMemeCoinType = {
  [memeCoinType: string]: PoolWithDetailedInfoType;
};

export type GetAllPoolsMapByPoolObjectIdType = {
  [poolObjectId: string]: PoolWithDetailedInfoType;
};
