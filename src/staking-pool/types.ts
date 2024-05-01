export type StakingPoolUnstakeArgs = {
  inputAmount: string;
  signerAddress: string;
};

export type StakingPoolWithdrawArgs = {
  signerAddress: string;
};

export type StakingPoolAddFeesArgs = {
  memeCoinInput: string;
  suiCoinInput: string;
  signerAddress: string;
};
