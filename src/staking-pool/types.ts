import { TransactionBlock } from "@mysten/sui.js/transactions";

export type StakingPoolUnstakeArgs = {
  inputAmount: string;
  signerAddress: string;
} & { transaction?: TransactionBlock };

export type StakingPoolWithdrawArgs = {
  signerAddress: string;
};

export type StakingPoolAddFeesArgs = {
  memeCoinInput: string;
  suiCoinInput: string;
  signerAddress: string;
};
