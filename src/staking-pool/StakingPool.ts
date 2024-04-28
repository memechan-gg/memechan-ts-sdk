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
import { getCoins } from "./utils/getCoins";
import { mergeCoins } from "./utils/mergeCoins";
/**
 * @class StakingPoolSingleton
 * @implements {StakingPoolSingleton}
 * @description Singleton class for managing staking curve pool.
 */
export class StakingPoolSingleton {
  private static _instance: StakingPoolSingleton;
  public static GAS_BUDGET = 50_000_000;
  public static SIMULATION_ACCOUNT_ADDRESS = "0xac5bceec1b789ff840d7d4e6ce4ce61c90d190a7f8c4f4ddf0bff6ee2413c33c";

  public static TICKETCOIN_DECIMALS = "6";
  public static MEMECOIN_DECIMALS = "6";

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

  public async unstakeFromStakingPool(params: StakingPoolUnstakeArgs) {
    const { stakingPoolObjectId, inputAmount, memeCoin, ticketCoin, signerAddress } = params;
    const tx = new TransactionBlock();

    const tokenPolicyObjectId = await StakingPoolSingleton.getInstance().getTokenPolicyByPoolId({
      poolId: stakingPoolObjectId.toString(),
    });

    const inputAmountWithDecimals = normalizeInputCoinAmount(
      inputAmount,
      parseInt(StakingPoolSingleton.TICKETCOIN_DECIMALS),
    );

    const ticketCoins = await getCoins({
      address: signerAddress,
      coin: ticketCoin.coinType,
      provider: this.provider,
    });

    if (ticketCoins.length === 0) {
      throw new Error(`[unstakeFromStakingPool] No ticket coins found for the user ${signerAddress}`);
    }

    const { mergedCoin } = mergeCoins({
      coins: ticketCoins,
      tx,
    });

    const ticketCoinObject = tx.splitCoins(mergedCoin, [inputAmountWithDecimals]);

    const [memecoin, lpcoin] = unstake(tx, [ticketCoin.coinType, memeCoin.coinType, LONG_SUI_COIN_TYPE], {
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

    const [memecoin, lpcoin] = withdrawFees(
      tx,
      [ticketCoin.coinType, memeCoin.coinType, LONG_SUI_COIN_TYPE],
      stakingPoolObjectId,
    );

    tx.transferObjects([memecoin], tx.pure(signerAddress));
    tx.transferObjects([lpcoin], tx.pure(signerAddress));
    tx.setGasBudget(StakingPoolSingleton.GAS_BUDGET);

    return { tx };
  }

  public async addFeesToStakingPool(params: StakingPoolAddFeesArgs) {
    const { stakingPoolObjectId, memeCoin, memeCoinInput, suiCoinInput, ticketCoin, signerAddress } = params;
    const tx = new TransactionBlock();

    const memeCoinSplitAmount = normalizeInputCoinAmount(
      memeCoinInput,
      parseInt(StakingPoolSingleton.MEMECOIN_DECIMALS),
    );
    const suiCoinSplitAmount = normalizeInputCoinAmount(suiCoinInput, SUI_DECIMALS);

    const memeCoins = await getCoins({
      address: signerAddress,
      coin: memeCoin.coinType,
      provider: this.provider,
    });

    if (memeCoins.length === 0) {
      throw new Error(`[addFeesToStakingPool] No meme coins found for the user ${signerAddress}`);
    }

    const { mergedCoin } = mergeCoins({
      coins: memeCoins,
      tx,
    });

    const memeCoinObject = tx.splitCoins(mergedCoin, [memeCoinSplitAmount]);
    const suiCoinObject = tx.splitCoins(tx.gas, [suiCoinSplitAmount]);

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
