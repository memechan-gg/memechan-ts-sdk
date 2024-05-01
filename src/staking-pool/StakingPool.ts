/* eslint-disable require-jsdoc */
import {
  collectFees,
  CollectFeesArgs,
  unstake,
  withdrawFees,
} from "@avernikoz/memechan-ts-interface/dist/memechan/staking-pool/functions";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { LONG_SUI_COIN_TYPE, SHORT_SUI_COIN_TYPE } from "../common/sui";
import { StakingPoolUnstakeArgs } from "./types";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui.js/utils";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { isTokenPolicyCapObjectData } from "../bonding-pool/utils/isTokenPolicyCapObjectData";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import BigNumber from "bignumber.js";
import { getAllTokens, getMergedToken } from "../common/tokens";

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
   * @param {TransactionBlock} tx - The transaction block to withdraw fees.
   * @param {string} signerAddress - the wallet address that you are using to withdraw the fees
   * @return {TransactionResult} The result of the withdrawFees function call
   */
  withdrawFees(tx: TransactionBlock, signerAddress: string) {
    const [memecoin, lpcoin] = withdrawFees(
      tx,
      [SHORT_SUI_COIN_TYPE, this.params.memeCoinType, this.params.lpCoinType],
      this.params.address,
    );
    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));
    return tx;
  }

  /**
   * Unstakes assets from the staking pool.
   * @param {TransactionBlock} tx - The tx parameter
   * @param {StakingPoolUnstakeArgs} params - The parameters required for unstaking.
   * @return {Promise<{tx: TransactionBlock}>} The transaction block object with the results of the unstake operation.
   */
  public async unstake(tx: TransactionBlock, params: StakingPoolUnstakeArgs) {
    const { inputAmount, signerAddress } = params;

    const tokenPolicyObjectId = await this.getTokenPolicy();

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, parseInt(StakingPool.TICKETCOIN_DECIMALS));

    const remainingAmountBN = new BigNumber(inputAmountWithDecimals.toString());
    const ownedTokens = await getAllTokens({
      walletAddress: signerAddress,
      coinType: this.params.memeCoinType,
      provider: this.provider,
    });
    const tokenObject = getMergedToken({
      remainingAmountBN,
      availableTokens: ownedTokens,
      tokenPolicyObjectId,
      memeCoinType: this.params.memeCoinType,
      transaction: tx,
    });

    const [memecoin, lpcoin] = unstake(tx, [LONG_SUI_COIN_TYPE, this.params.memeCoinType, this.params.lpCoinType], {
      clock: SUI_CLOCK_OBJECT_ID,
      coinX: tokenObject,
      policy: tokenPolicyObjectId,
      stakingPool: this.params.address,
    });

    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));

    return { tx };
  }

  /**
   * Retrieves the Token Policy Cap Object ID by the pool ID.
   * @param {{ poolId: string }} param0 - Object containing the pool ID.
   * @return {Promise<string>} The Token Policy Cap Object ID associated with the pool.
   * @throws Will throw an error if no token policy cap object is found or if
   * there are multiple with no clear resolution.
   */
  public async getTokenPolicyCap() {
    const poolDynamicFields = await getAllDynamicFields({
      parentObjectId: this.params.address,
      provider: this.provider,
    });
    const tokenPolicyCapList = poolDynamicFields.filter((el) => el.objectType.includes("0x2::token::TokenPolicyCap"));

    if (tokenPolicyCapList.length === 0) {
      throw new Error(`[getTokenPolicyCapByPoolId] No token policy cap found for the pool ${this.params.address}`);
    }

    if (tokenPolicyCapList.length > 1) {
      console.warn(
        `[getTokenPolicyCapByPoolId] Warning: multiple tokenPolicyCaps found for pool ${this.params.address},
        ignoring the rest except first`,
        tokenPolicyCapList,
      );
    }

    const [tokenPolicyCapObject] = tokenPolicyCapList;
    const tokenPolicyCapObjectId = tokenPolicyCapObject.objectId;

    return tokenPolicyCapObjectId;
  }

  public async getTokenPolicy() {
    const tokenPolicyCap = await this.getTokenPolicyCap();

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
