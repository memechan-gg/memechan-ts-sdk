/* eslint-disable require-jsdoc */
import {
  collectFees,
  CollectFeesArgs,
  unstake,
  withdrawFees,
} from "@avernikoz/memechan-ts-interface/dist/memechan/staking-pool/functions";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { LONG_SUI_COIN_TYPE, SHORT_SUI_COIN_TYPE } from "../common/sui";
import { StakingPoolUnstakeArgs, StakingPoolWithdrawArgs } from "./types";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui.js/utils";
import { mergeCoins } from "./utils/mergeCoins";
import { getCoins } from "./utils/getCoins";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { isTokenPolicyCapObjectData } from "../bonding-pool/utils/isTokenPolicyCapObjectData";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";

type StakingPoolParams = {
  address: string;
  memeCoinType: string;
  lpCoinType: string;
};

/**
 * Class representing a staking pool.
 */
export class StakingPool {
  public static SIMULATION_ACCOUNT_ADDRESS = "0xac5bceec1b789ff840d7d4e6ce4ce61c90d190a7f8c4f4ddf0bff6ee2413c33c";

  public static TICKETCOIN_DECIMALS = "6";
  public static MEMECOIN_DECIMALS = "6";
  provider = new SuiClient({ url: getFullnodeUrl("mainnet") });

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
   * @param {string} signerAddress - the wallet address that you are using to withdraw the fees
   * @param {TransactionBlock} tx - The transaction block to withdraw fees.
   * @return {TransactionResult} The result of the withdrawFees function call
   */
  withdrawFees(signerAddress: string, tx: TransactionBlock) {
    const [memecoin, lpcoin] = withdrawFees(
      tx,
      [SHORT_SUI_COIN_TYPE, this.params.memeCoinType, this.params.lpCoinType],
      this.params.address,
    );
    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));
    return tx;
  }

  public async unstakeFromStakingPool(params: StakingPoolUnstakeArgs) {
    const { inputAmount, signerAddress } = params;
    const tx = new TransactionBlock();

    const tokenPolicyObjectId = await this.getTokenPolicy();

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, parseInt(StakingPool.TICKETCOIN_DECIMALS));
    const ticketCoins = await getCoins({
      address: signerAddress,
      coin: ticketCoin.coinType,
      provider: this.provider,
    });
    const [memecoin, lpcoin] = unstake(tx, [LONG_SUI_COIN_TYPE, this.params.memeCoinType, this.params.lpCoinType], {
      clock: SUI_CLOCK_OBJECT_ID,
      coinX: ticketCoinObject,
      policy: tokenPolicyObjectId,
      stakingPool: this.params.address,
    });

    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));

    return { tx };
  }

  public async getTokenPolicyCapByPoolId({ poolId }: { poolId: string }) {
    const poolDynamicFields = await getAllDynamicFields({ parentObjectId: poolId, provider: this.provider });
    const tokenPolicyCapList = poolDynamicFields.filter((el) => el.objectType.includes("0x2::token::TokenPolicyCap"));

    if (tokenPolicyCapList.length === 0) {
      throw new Error(`[getTokenPolicyCapByPoolId] No token policy cap found for the pool ${poolId}`);
    }

    if (tokenPolicyCapList.length > 1) {
      console.warn(
        `[getTokenPolicyCapByPoolId] Warning: multiple tokenPolicyCaps found for pool ${poolId},
        ignoring the rest except first`,
        tokenPolicyCapList,
      );
    }

    const [tokenPolicyCapObject] = tokenPolicyCapList;
    const tokenPolicyCapObjectId = tokenPolicyCapObject.objectId;

    return tokenPolicyCapObjectId;
  }

  public async getTokenPolicy() {
    const tokenPolicyCap = await this.getTokenPolicyCapByPoolId({ poolId: this.params.address });

    const tokenPolicyCapObjectData = await this.provider.getObject({
      id: tokenPolicyCap,
      options: { showContent: true, showOwner: true, showType: true },
    });

    if (!isTokenPolicyCapObjectData(tokenPolicyCapObjectData)) {
      throw new Error(`[getTokenPolicyByPoolId] No token policy cap found for the pool ${this.params.address}`);
    }

    const tokenPolicyObjectId = tokenPolicyCapObjectData.data?.content.fields.value.fields.for;

    return tokenPolicyObjectId;
  }
}
