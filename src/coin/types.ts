import { CoinMetadata } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

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

export type CreateCoinExternalApiResType = {
  modules: string[] | number[][];
  dependencies: string[];
  digest: number[];
};

export type CommonCoinData = {
  symbol?: string;
  type: string;
  decimals: number;
} & CoinMetadata;

export interface ICoinManager {
  getCoinByType2(coinType: string): Promise<CommonCoinData | null>;
}
