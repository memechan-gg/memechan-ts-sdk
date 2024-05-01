import {
  collectFees,
  CollectFeesArgs,
  withdrawFees,
} from "@avernikoz/memechan-ts-interface/dist/memechan/staking-pool/functions";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SHORT_SUI_COIN_TYPE } from "../common/sui";

type StakingPoolParams = {
  address: string;
  memeCoinType: string;
  lpCoinType: string;
};

/**
 * Class representing a staking pool.
 */
export class StakingPool {
  /**
   * Create a StakingPool.
   * @param {StakingPoolParams} params - The staking pool parameters.
   */
  constructor(private params: StakingPoolParams) {}

  /**
   * Collects fees from the staking pool.
   * @param {TransactionBlock} tx - The transaction block to collect fees.
   * @param {Omit<CollectFeesArgs, "clock" | "staking_pool">} params - Parameters for the collectFees function,
   * omitting the clock and staking pool properties which are set internally.
   * @return {TransactionResult} The result of the collectFees function call
   */
  collectFees(tx: TransactionBlock, params: Omit<CollectFeesArgs, "clock" | "staking_pool">) {
    return collectFees(tx, [SHORT_SUI_COIN_TYPE, this.params.memeCoinType, this.params.lpCoinType], {
      stakingPool: this.params.address,
      pool: params.pool,
      clock: "0x6",
    });
  }

  /**
   * Withdraws fees from the staking pool.
   * @param {TransactionBlock} tx - The transaction block to withdraw fees.
   * @return {TransactionResult} The result of the withdrawFees function call
   */
  withdrawFees(tx: TransactionBlock) {
    return withdrawFees(
      tx,
      [SHORT_SUI_COIN_TYPE, this.params.memeCoinType, this.params.lpCoinType],
      this.params.address,
    );
  }
}
