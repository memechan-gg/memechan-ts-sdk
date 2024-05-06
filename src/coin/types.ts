import { CoinMetadata } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { z } from "zod";
import { Coin, coinSchema, paginatedResultSchema } from "./schemas/coin-schemas";
import { livePool, SeedPool, seedPool, stakingPool } from "./schemas/pools-schema";

export type CreateCoinTransactionParams = {
  name: string;
  symbol: string;
  decimals: string;
  fixedSupply: boolean;
  mintAmount: string;
  url: string;
  description: string;
  signerAddress: string;
  transaction?: TransactionBlock;
};

export type CommonCoinData = {
  symbol?: string;
  type: string;
  decimals: number;
} & CoinMetadata;

export interface ICoinManager {
  getCoinByType2(coinType: string): Promise<CommonCoinData | null>;
}

export type CreateCoinResponse = {
  coin: Coin;
};

export const paginatedCoinResultSchema = () => paginatedResultSchema(coinSchema);
export type QueryCoinsResponse = z.infer<ReturnType<typeof paginatedCoinResultSchema>>;

export const paginatedSeedPoolsResultSchema = () => paginatedResultSchema(seedPool);
export type QueryAllSeedPoolsResponse = z.infer<ReturnType<typeof paginatedSeedPoolsResultSchema>>;

export const paginatedLivePoolsResultSchema = () => paginatedResultSchema(livePool);
export type QueryAllLivePoolsResponse = z.infer<ReturnType<typeof paginatedLivePoolsResultSchema>>;

export const paginatedStakingPoolsResultSchema = () => paginatedResultSchema(stakingPool);
export type QueryAllStakingPoolsResponse = z.infer<ReturnType<typeof paginatedStakingPoolsResultSchema>>;

export type GetCoinResponse = Coin;

export type GetSeedPool = SeedPool;

export type UploadFileResponse = {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate: boolean;
};

export type PriceApiResponse = {
  data: {
    chainid: string;
    tokenAddress: string;
    price: number;
    fetchedFrom: string;
  };
};
