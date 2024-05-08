import { ObjectArg } from "@avernikoz/memechan-ts-interface/dist/_framework/util";
import { CollectFeesArgs } from "@avernikoz/memechan-ts-interface/dist/memechan/staking-pool/functions";
import { TransactionBlock } from "@mysten/sui.js/transactions";

export type StakingPoolUnstakeArgs = {
  inputAmount: string;
  signerAddress: string;
} & { transaction?: TransactionBlock };

export type StakingPoolAddFeesArgs = {
  memeCoinInput: string;
  suiCoinInput: string;
  signerAddress: string;
};

export type GetStakingPoolCollectFeesArgs = Omit<CollectFeesArgs, "clock" | "staking_pool" | "pool"> & {
  clmmPool: ObjectArg;
} & {
  transaction?: TransactionBlock;
};

export type GetCollectFeesAndUnstakeTransactionArgs = StakingPoolUnstakeArgs & GetStakingPoolCollectFeesArgs;

export type GetWithdrawFeesArgs = { signerAddress: string } & {
  transaction?: TransactionBlock;
};

export type GetCollectFeesAndWithdrawTransactionArgs = GetWithdrawFeesArgs & GetStakingPoolCollectFeesArgs;
