/* eslint-disable require-jsdoc */
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { addFees, unstake, withdrawFees } from "@avernikoz/memechan-ts-interface/dist/memechan/staking-pool/functions";
import { SUI_CLOCK_OBJECT_ID, SUI_DECIMALS } from "@mysten/sui.js/utils";
import { StakingPoolAddFeesArgs, StakingPoolUnstakeArgs, StakingPoolWithdrawArgs } from "./types";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import { isTokenPolicyCapObjectData } from "../bonding-pool/utils/isTokenPolicyCapObjectData";
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { LONG_SUI_COIN_TYPE } from "../common/sui";
/**
 * @class StakingPoolSingleton
 * @implements {StakingPoolSingleton}
 * @description Singleton class for managing staking curve pool.
 */
export class StakingPoolSingleton {
  private static _instance: StakingPoolSingleton;
  public static GAS_BUDGET = 50_000_000;
  public static SIMULATION_ACCOUNT_ADDRESS = "0xac5bceec1b789ff840d7d4e6ce4ce61c90d190a7f8c4f4ddf0bff6ee2413c33c";

  public provider: SuiClient;
  public suiProviderUrl: string;

  /**
   * Constructs a new instance of the SuiProvider class with the provided SUI provider URL.
   *
   * @private
   * @constructor
   * @param {string} suiProviderUrl - The URL of the SUI provider.
   */
  private constructor(suiProviderUrl: string) {
    this.provider = new SuiClient({ url: suiProviderUrl });
    this.suiProviderUrl = suiProviderUrl;
  }

  /**
   * @public
   * @method getInstance
   * @description Gets the singleton instance of StakingPoolSingleton.
   * @param {string} [suiProviderUrl] - Url of SUI provider.
   * @return {StakingPoolSingleton} The singleton instance of StakingPoolSingleton.
   */
  public static getInstance(suiProviderUrl?: string): StakingPoolSingleton {
    if (!StakingPoolSingleton._instance) {
      if (suiProviderUrl === undefined) {
        throw new Error(
          "[StakingPoolSingleton] SUI provider url is required in arguments to create BondingPool instance.",
        );
      }

      const instance = new StakingPoolSingleton(suiProviderUrl);
      StakingPoolSingleton._instance = instance;
    }

    return StakingPoolSingleton._instance;
  }

  public static async unstakeFromStakingPool(params: StakingPoolUnstakeArgs) {
    const { stakingPoolObjectId, inputAmount, memeCoin, ticketCoin, signerAddress } = params;
    const tx = new TransactionBlock();

    const tokenPolicyObjectId = await StakingPoolSingleton.getInstance().getTokenPolicyByPoolId({
      poolId: stakingPoolObjectId.toString(),
    });

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, SUI_DECIMALS);

    // TODO: Change that to actual coin
    const ticketCoinObject = tx.splitCoins(tx.gas, [inputAmountWithDecimals]);

    let [memecoin, lpcoin] = unstake(tx, [ticketCoin.coinType, memeCoin.coinType, LONG_SUI_COIN_TYPE], {
      clock: SUI_CLOCK_OBJECT_ID,
      coinX: ticketCoinObject,
      policy: tokenPolicyObjectId,
      stakingPool: stakingPoolObjectId,
    });

    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));
    tx.transferObjects([ticketCoinObject], tx.pure(signerAddress));
    tx.setGasBudget(StakingPoolSingleton.GAS_BUDGET);

    return { tx };
  }

  public static async withdrawFromStakingPool(params: StakingPoolWithdrawArgs) {
    const { stakingPoolObjectId, memeCoin, ticketCoin, signerAddress } = params;
    const tx = new TransactionBlock();

    let [memecoin, lpcoin] = withdrawFees(
      tx,
      [ticketCoin.coinType, memeCoin.coinType, LONG_SUI_COIN_TYPE],
      stakingPoolObjectId,
    );

    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));
    tx.setGasBudget(StakingPoolSingleton.GAS_BUDGET);

    return { tx };
  }

  public static async addFeesToStakingPool(params: StakingPoolAddFeesArgs) {
    const { stakingPoolObjectId, memeCoin, memeCoinInput, suiCoinInput, ticketCoin } = params;
    const tx = new TransactionBlock();

    // TODO: Change that to actual coin
    const memeCoinObject = tx.splitCoins(tx.gas, [memeCoinInput]);
    const suiCoinObject = tx.splitCoins(tx.gas, [suiCoinInput]);

    addFees(tx, [ticketCoin.coinType, memeCoin.coinType, LONG_SUI_COIN_TYPE], {
      coinMeme: memeCoinObject,
      coinSui: suiCoinObject,
      stakingPool: stakingPoolObjectId,
    });

    tx.setGasBudget(StakingPoolSingleton.GAS_BUDGET);
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

  public async getTokenPolicyByPoolId({ poolId }: { poolId: string }) {
    const tokenPolicyCap = await this.getTokenPolicyCapByPoolId({ poolId });

    const tokenPolicyCapObjectData = await this.provider.getObject({
      id: tokenPolicyCap,
      options: { showContent: true, showOwner: true, showType: true },
    });

    if (!isTokenPolicyCapObjectData(tokenPolicyCapObjectData)) {
      throw new Error(`[getTokenPolicyByPoolId] No token policy cap found for the pool ${poolId}`);
    }

    const tokenPolicyObjectId = tokenPolicyCapObjectData.data?.content.fields.value.fields.for;

    return tokenPolicyObjectId;
  }
}
