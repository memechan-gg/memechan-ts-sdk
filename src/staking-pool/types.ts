export type StakingPoolCollectFeesParams = {
  coinType: string;
  lpCoinType: string;
};

export type CreateVestingConfigParams = {
  startTs: number;
  cliffTs: number;
  endTs: number;
};
