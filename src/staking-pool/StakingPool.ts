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
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { isTokenPolicyCapObjectData } from "../bonding-pool/utils/isTokenPolicyCapObjectData";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import BigNumber from "bignumber.js";
import { getAllTokens, getMergedToken } from "../common/tokens";
import { SuiClient } from "@mysten/sui.js/client";
import { stakingPoolCreatedSchema, stakingPoolDescribeObjectResponse } from "./schemas";
import { BondingPoolSingleton } from "../bonding-pool/BondingPool";
import { VestingConfig } from "./VestingConfig";
import { UserWithdrawals } from "./UserWithdrawals";
import { FeeState } from "./FeeState";

type StakingPoolData = {
  address: string;
  memeCoinType: string;
  lpCoinType: string;
  totalSupply: string;
  ammPool: string;
  balanceLp: string;
  balanceMeme: string;
  feeState: FeeState;
  poolAdmin: string;
  vesting: VestingConfig;
};

type StakingPoolParams = {
  data: StakingPoolData;
  provider: SuiClient;
};

/**
 * Class representing a staking pool.
 */
export class StakingPool {
  public static SIMULATION_ACCOUNT_ADDRESS = "0xac5bceec1b789ff840d7d4e6ce4ce61c90d190a7f8c4f4ddf0bff6ee2413c33c";

  public static TICKETCOIN_DECIMALS = BondingPoolSingleton.TICKET_COIN_DECIMALS;
  public static MEMECOIN_DECIMALS = BondingPoolSingleton.MEMECOIN_DECIMALS;
  public data: StakingPoolData;

  /**
   * Create a StakingPool.
   * @param {StakingPoolParams} params - The staking pool parameters.
   */
  constructor(private params: StakingPoolParams) {
    this.data = params.data;
  }

  /**
   * Collects fees from the staking pool.
   * @param {TransactionBlock} tx - The transaction block to collect fees.
   * @param {Omit<CollectFeesArgs, "clock" | "staking_pool">} params - Parameters for the collectFees function,
   * omitting the clock and staking pool properties which are set internally.
   * @return {TransactionResult} The result of the collectFees function call
   */
  collectFees(tx: TransactionBlock, params: Omit<CollectFeesArgs, "clock" | "staking_pool">) {
    return collectFees(tx, [SHORT_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType], {
      stakingPool: this.data.address,
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
      [SHORT_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType],
      this.data.address,
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
      coinType: this.data.memeCoinType,
      provider: this.params.provider,
    });
    const tokenObject = getMergedToken({
      remainingAmountBN,
      availableTokens: ownedTokens,
      tokenPolicyObjectId,
      memeCoinType: this.data.memeCoinType,
      transaction: tx,
    });

    const [memecoin, lpcoin] = unstake(tx, [LONG_SUI_COIN_TYPE, this.data.memeCoinType, this.data.lpCoinType], {
      clock: SUI_CLOCK_OBJECT_ID,
      coinX: tokenObject,
      policy: tokenPolicyObjectId,
      stakingPool: this.data.address,
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
      parentObjectId: this.data.address,
      provider: this.params.provider,
    });
    const tokenPolicyCapList = poolDynamicFields.filter((el) => el.objectType.includes("0x2::token::TokenPolicyCap"));

    if (tokenPolicyCapList.length === 0) {
      throw new Error(`[getTokenPolicyCapByPoolId] No token policy cap found for the pool ${this.data.address}`);
    }

    if (tokenPolicyCapList.length > 1) {
      console.warn(
        `[getTokenPolicyCapByPoolId] Warning: multiple tokenPolicyCaps found for pool ${this.data.address},
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

    const tokenPolicyCapObjectData = await this.params.provider.getObject({
      id: tokenPolicyCap,
      options: { showContent: true, showOwner: true, showType: true },
    });

    if (!isTokenPolicyCapObjectData(tokenPolicyCapObjectData)) {
      throw new Error(`[getTokenPolicyByPoolId] No token policy cap found for the pool ${this.data.address}`);
    }

    const tokenPolicyObjectId = tokenPolicyCapObjectData.data?.content.fields.value.fields.for;

    return tokenPolicyObjectId;
  }

  static async fromObjectId({ objectId, provider }: { objectId: string; provider: SuiClient }) {
    const object = await provider.getObject({
      id: objectId,
      options: {
        showContent: true,
        showType: true,
      },
    });
    const matches = object.data?.type?.match(/<[^>]*,\s*([^,>]+),\s*([^,>]+)>/);
    if (!matches || matches.length < 2) {
      throw new Error("Invalid object type format.");
    }
    const [_, memeCoinType, lpCoinType] = matches;
    const stakingPoolResponse = stakingPoolDescribeObjectResponse.parse(object.data?.content).fields;
    const vestingFields = stakingPoolResponse.vesting_config.fields;
    const vestingConfig = await VestingConfig.fromTableId({
      id: stakingPoolResponse.vesting_table.fields.id.id,
      provider,
      data: {
        cliffTs: vestingFields.cliff_ts,
        endTs: vestingFields.end_ts,
        startTs: vestingFields.start_ts,
      },
    });
    const feeStateFields = stakingPoolResponse.fee_state.fields;
    const feeState = new FeeState({
      provider,
      data: {
        stakesTotal: feeStateFields.stakes_total,
        feesSTotal: feeStateFields.fees_s_total,
        feesMeme: feeStateFields.fees_meme,
        feesMemeTotal: feeStateFields.fees_meme_total,
        feesS: feeStateFields.fees_s,
        userWithdrawalsX: await UserWithdrawals.fromTableId({
          id: feeStateFields.user_withdrawals_x.fields.id.id,
          provider,
        }),
        userWithdrawalsY: await UserWithdrawals.fromTableId({
          id: feeStateFields.user_withdrawals_y.fields.id.id,
          provider,
        }),
      },
    });
    return new StakingPool({
      data: {
        feeState,
        vesting: vestingConfig,
        address: object.data!.objectId,
        ammPool: stakingPoolResponse.amm_pool,
        poolAdmin: stakingPoolResponse.pool_admin.fields.id.id,
        totalSupply: stakingPoolResponse.meme_cap.fields.total_supply.fields.value,
        lpCoinType,
        memeCoinType,
        balanceLp: stakingPoolResponse.balance_lp,
        balanceMeme: stakingPoolResponse.balance_meme,
      },
      provider,
    });
  }

  static async fromGoLiveDefaultTx({ txDigest, provider }: { txDigest: string; provider: SuiClient }) {
    const txResult = await provider.getTransactionBlock({ digest: txDigest, options: { showObjectChanges: true } });
    const schema = stakingPoolCreatedSchema(BondingPoolSingleton.PACKAGE_OBJECT_ID);
    const createdStakedPool = schema.parse(txResult.objectChanges?.find((oc) => schema.safeParse(oc).success));
    return StakingPool.fromObjectId({ objectId: createdStakedPool.objectId, provider });
  }
}
