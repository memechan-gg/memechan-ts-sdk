export type StakingPoolUnstakeArgs = {
  stakingPoolObjectId: string;
  inputAmount: string;
  memeCoin: {
    coinType: string;
  };
  ticketCoin: {
    coinType: string;
  };
  signerAddress: string;
};

export type StakingPoolWithdrawArgs = {
  stakingPoolObjectId: string;
  memeCoin: {
    coinType: string;
  };
  ticketCoin: {
    coinType: string;
  };
  signerAddress: string;
};

export type StakingPoolAddFeesArgs = {
  stakingPoolObjectId: string;
  memeCoin: {
    coinType: string;
  };
  memeCoinInput: string;
  suiCoinInput: string;
  ticketCoin: {
    coinType: string;
  };
  signerAddress: string;
};
