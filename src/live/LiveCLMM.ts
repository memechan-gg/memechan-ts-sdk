/* eslint-disable require-jsdoc */
import { CLAMM, InterestPool } from "@interest-protocol/clamm-sdk";
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SUI_DECIMALS } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { BondingPoolSingleton } from "../bonding-pool/BondingPool";
import { deductSlippage } from "../bonding-pool/utils/deductSlippage";
import { getAllDynamicFields } from "../bonding-pool/utils/getAllDynamicFields";
import { getAllObjects } from "../bonding-pool/utils/getAllObjects";
import { isPoolObjectData } from "../bonding-pool/utils/isPoolObjectData";
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { isRegistryTableTypenameDynamicFields } from "../bonding-pool/utils/registryTableTypenameUtils";
import { CoinManagerSingleton } from "../coin/CoinManager";
import { LONG_SUI_COIN_TYPE } from "../common/sui";
import { chunkedRequests } from "../utils/chunking";
import { registrySchemaContent } from "../utils/schema";
import { interestPoolCreatedSchema } from "./schemas";
import {
  AddLiquidityArgs,
  QuoteAddLiquidityArgs,
  QuoteRemoveLiquidityArgs,
  QuoteSwapArgs,
  RemoveLiquidityArgs,
  SwapArgs,
} from "./types";
import { getCoins } from "./utils/getCoins";
import { mergeCoins } from "./utils/mergeCoins";

export type LiveCLMMData = {
  poolId?: string;
  memeCoin?: {
    coinType: string;
  };
};

export type LiveCLMMParams = {
  provider: SuiClient;
  data: LiveCLMMData;
};

/**
 * @class LiveCLMMSingleton
 * @implements {LiveCLMMSingleton}
 * @description Singleton class for managing live clmm pool.
 */
export class LiveCLMM {
  private static SUI_TEARS_ADDRESS = "0x7ba65fa88ed4026304b7f95ee86f96f8169170efe84b56d465b4fe305e2486cb";
  private static CLMM_ADDRESS = "0x429dbf2fc849c0b4146db09af38c104ae7a3ed746baf835fa57fee27fa5ff382";
  // TODO: We need to move it outside and store it somewhere across different classes (CLMM, Bonding, Staking)
  // Somewhere in config
  public static MEMECOIN_DECIMALS = "6";

  public clamm: CLAMM;
  private _pool: InterestPool | undefined;
  public data: LiveCLMMData;

  /**
   * Constructs a new instance of the SuiProvider class with the provided SUI provider URL.
   *
   * @private
   * @constructor
   * @param {string} suiProviderUrl - The URL of the SUI provider.
   * @param {string} poolId - The ID of the pool.
   */
  constructor(private params: LiveCLMMParams) {
    this.data = params.data;
    this.clamm = new CLAMM({
      network: "mainnet",
      packageAddress: LiveCLMM.CLMM_ADDRESS,
      suiClient: params.provider,
      suiTearsAddress: LiveCLMM.SUI_TEARS_ADDRESS,
    });
  }

  public async getPool(): Promise<InterestPool> {
    if (this._pool === undefined) {
      if (this.data.poolId) {
        this._pool = await this.clamm.getPool(this.data.poolId);
      } else if (this.data.memeCoin) {
        const pools = await this.clamm.getPools({
          coinTypes: [this.data.memeCoin.coinType],
        });

        if (pools.pools.length === 0) {
          throw new Error("No pool found for the meme coin");
        }

        this._pool = await this.clamm.getPool(pools.pools[0].poolObjectId);
      } else {
        throw new Error("No pool found, please provide poolId or memeCoin");
      }
    }

    return this._pool;
  }

  static async fromGoLiveDefaultTx({ txDigest, provider }: { txDigest: string; provider: SuiClient }) {
    const txResult = await provider.getTransactionBlock({ digest: txDigest, options: { showObjectChanges: true } });
    const schema = interestPoolCreatedSchema(LiveCLMM.CLMM_ADDRESS);
    console.log(LiveCLMM.CLMM_ADDRESS, txResult.objectChanges);
    const createdLivePool = schema.parse(txResult.objectChanges?.find((oc) => schema.safeParse(oc).success));
    return new LiveCLMM({ data: { poolId: createdLivePool.objectId }, provider });
  }

  public async addLiquidity(params: AddLiquidityArgs) {
    const tx = new TransactionBlock();
    const { signerAddress, memeCoin, memeCoinInput, suiCoinInput, minOutputAmount, slippagePercentage = 0 } = params;
    const pool = await this.getPool();

    const memeCoins = await getCoins({
      address: signerAddress,
      coin: memeCoin.coinType,
      provider: this.params.provider,
    });

    const mergedMemeCoin = mergeCoins({
      coins: memeCoins,
      tx,
    }).mergeCoin;

    const suiCoinSplitAmount = normalizeInputCoinAmount(suiCoinInput, SUI_DECIMALS);
    const memeCoinSplitAmount = normalizeInputCoinAmount(memeCoinInput, parseInt(LiveCLMM.MEMECOIN_DECIMALS));

    const suiCoinSplitted = tx.splitCoins(tx.gas, [suiCoinSplitAmount]);
    const memeCoinSplitted = tx.splitCoins(mergedMemeCoin, [memeCoinSplitAmount]);

    // Deduct slippage from min output amount
    const minOutputWithSlippage = deductSlippage(new BigNumber(minOutputAmount), slippagePercentage);
    const minOutputNormalized = normalizeInputCoinAmount(minOutputWithSlippage.toString(), SUI_DECIMALS);
    const minAmount = BigInt(minOutputNormalized);

    const coinsOut = await this.clamm.addLiquidity({
      coinsIn: [suiCoinSplitted, memeCoinSplitted],
      minAmount,
      pool,
      txb: tx,
    });

    tx.transferObjects(coinsOut.lpCoin, signerAddress);

    return coinsOut.txb;
  }

  public async removeLiquidity(params: RemoveLiquidityArgs) {
    const tx = new TransactionBlock();
    const { signerAddress, lpCoinInput, lpCoin, minAmounts, slippagePercentage = 0 } = params;
    const pool = await this.getPool();

    const lpCoins = await getCoins({
      address: signerAddress,
      coin: lpCoin.coinType,
      provider: this.params.provider,
    });

    const mergedLpCoin = mergeCoins({
      coins: lpCoins,
      tx,
    }).mergeCoin;

    const lpCoinSplitAmount = normalizeInputCoinAmount(lpCoinInput, SUI_DECIMALS);
    const lpCoinSplitted = tx.splitCoins(mergedLpCoin, [lpCoinSplitAmount]);

    // Deduct slippage from min output amount
    const minSuiAmountWithSlippage = deductSlippage(new BigNumber(minAmounts.suiCoin), slippagePercentage);
    const minMemeAmountWithSlippage = deductSlippage(new BigNumber(minAmounts.memeCoin), slippagePercentage);

    const minSuiAmountNormalized = normalizeInputCoinAmount(minSuiAmountWithSlippage.toString(), SUI_DECIMALS);
    const minMemeAmountNormalized = normalizeInputCoinAmount(
      minMemeAmountWithSlippage.toString(),
      +LiveCLMM.MEMECOIN_DECIMALS,
    );

    const minSuiAmount = BigInt(minSuiAmountNormalized);
    const minMemeAmount = BigInt(minMemeAmountNormalized);

    const coinsOut = await this.clamm.removeLiquidity({
      lpCoin: lpCoinSplitted,
      pool,
      txb: tx,
      minAmounts: [minSuiAmount, minMemeAmount],
    });

    coinsOut.coinsOut.forEach((coin) => tx.transferObjects([coin], signerAddress));

    return coinsOut.txb;
  }

  public async swap(params: SwapArgs) {
    const tx = new TransactionBlock();
    const { signerAddress, memeCoin, inputAmount, SuiToMeme, minOutputAmount, slippagePercentage = 0 } = params;
    const pool = await this.getPool();

    const splitAmount = SuiToMeme
      ? normalizeInputCoinAmount(inputAmount, SUI_DECIMALS)
      : normalizeInputCoinAmount(inputAmount, parseInt(LiveCLMM.MEMECOIN_DECIMALS));

    const coinIn = SuiToMeme
      ? tx.splitCoins(tx.gas, [splitAmount])
      : tx.splitCoins(
          mergeCoins({
            coins: await getCoins({
              address: signerAddress,
              coin: memeCoin.coinType,
              provider: this.params.provider,
            }),
            tx,
          }).mergeCoin,
          [splitAmount],
        );

    const minOutputWithSlippage = deductSlippage(new BigNumber(minOutputAmount), slippagePercentage);
    const minOutputNormalized = normalizeInputCoinAmount(
      minOutputWithSlippage.toString(),
      SuiToMeme ? +LiveCLMM.MEMECOIN_DECIMALS : SUI_DECIMALS,
    );

    const minOutputBigInt = BigInt(minOutputNormalized);

    const { coinOut, txb } = await this.clamm.swap({
      coinIn,
      pool,
      txb: tx,
      coinInType: SuiToMeme ? LONG_SUI_COIN_TYPE : memeCoin.coinType,
      coinOutType: SuiToMeme ? memeCoin.coinType : LONG_SUI_COIN_TYPE,
      minAmount: minOutputBigInt,
    });

    txb.transferObjects([coinOut], txb.pure(signerAddress));

    return txb;
  }

  public async getLpCoinType(): Promise<string> {
    return (await this.getPool()).lpCoinType;
  }

  public async quoteAddLiquidity(params: QuoteAddLiquidityArgs) {
    const { memeCoinInput, suiCoinInput, slippagePercentage } = params;
    const pool = await this.getPool();

    const suiCoinSplitAmount = normalizeInputCoinAmount(suiCoinInput, SUI_DECIMALS);
    const memeCoinSplitAmount = normalizeInputCoinAmount(memeCoinInput, parseInt(LiveCLMM.MEMECOIN_DECIMALS));

    const coinOut = await this.clamm.quoteAddLiquidity({
      amounts: [suiCoinSplitAmount, memeCoinSplitAmount],
      pool,
    });

    const outputAmount = new BigNumber(coinOut.toString()).div(10 ** parseInt(LiveCLMM.MEMECOIN_DECIMALS));
    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);
    return outputAmountRespectingSlippage.toString();
  }

  public async quoteRemoveLiquidity(params: QuoteRemoveLiquidityArgs) {
    const { lpCoinInput, slippagePercentage } = params;
    const pool = await this.getPool();

    const lpCoinSplitAmount = normalizeInputCoinAmount(lpCoinInput, SUI_DECIMALS);

    const coinsOut = await this.clamm.quoteRemoveLiquidity({
      amount: lpCoinSplitAmount,
      pool,
    });

    const outputAmounts = coinsOut.map((coinOut) => {
      return new BigNumber(coinOut.toString()).div(10 ** parseInt(LiveCLMM.MEMECOIN_DECIMALS));
    });

    const outputAmountsRespectingSlippage = outputAmounts.map((outputAmount) =>
      deductSlippage(outputAmount, slippagePercentage),
    );

    return outputAmountsRespectingSlippage.map((outputAmount) => outputAmount.toString());
  }

  public async quoteSwap(params: QuoteSwapArgs) {
    const { memeCoin, inputAmount, SuiToMeme, slippagePercentage } = params;
    const pool = await this.getPool();

    const splitAmount = SuiToMeme
      ? normalizeInputCoinAmount(inputAmount, SUI_DECIMALS)
      : normalizeInputCoinAmount(inputAmount, parseInt(LiveCLMM.MEMECOIN_DECIMALS));

    const { amount } = await this.clamm.quoteSwap({
      amount: splitAmount,
      pool,
      coinInType: SuiToMeme ? LONG_SUI_COIN_TYPE : memeCoin.coinType,
      coinOutType: SuiToMeme ? memeCoin.coinType : LONG_SUI_COIN_TYPE,
    });

    const outputAmount = new BigNumber(amount.toString()).div(
      10 ** parseInt(SuiToMeme ? LiveCLMM.MEMECOIN_DECIMALS : SUI_DECIMALS.toString()),
    );
    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);
    return outputAmountRespectingSlippage.toString();
  }

  static async fromObjectIds({ objectIds, provider }: { objectIds: string[]; provider: SuiClient }) {
    const objects = await chunkedRequests(objectIds, (ids) =>
      provider.multiGetObjects({
        ids,
        options: {
          showContent: true,
          showType: true,
        },
      }),
    );
    const results: LiveCLMM[] = [];
    for (const obj of objects) {
      results.push(
        new LiveCLMM({
          data: {
            poolId: obj.data?.objectId,
          },
          provider,
        }),
      );
    }
    return results;
  }

  /**
   * Queries a registry to retrieve an array of LivePool instances.
   * @param {SuiClient} provider - The blockchain client provider.
   * @return {Promise<LiveCLMM[]>} An array of LivePool instances.
   */
  static async fromRegistry({ provider }: { provider: SuiClient }): Promise<LiveCLMM[]> {
    const registry = await provider.getObject({
      id: BondingPoolSingleton.REGISTRY_OBJECT_ID,
      options: {
        showContent: true,
      },
    });
    const registryContent = registrySchemaContent.parse(registry.data?.content);
    const dfs = await getAllDynamicFields({
      parentObjectId: registryContent.fields.staking_pools.fields.id.id,
      provider,
    });

    if (!isRegistryTableTypenameDynamicFields(dfs)) {
      throw new Error("Wrong shape of typename dynamic fields of bonding curve registry table");
    }

    const typenameObjectIdsMap = dfs.reduce(
      (acc: { [objectId: string]: { objectId: string; registryKeyType: string } }, el) => {
        acc[el.objectId] = { objectId: el.objectId, registryKeyType: el.name.value.name };

        return acc;
      },
      {},
    );

    const tableTypenameObjectIds = Object.keys(typenameObjectIdsMap);

    const objectDataList = await getAllObjects({
      objectIds: tableTypenameObjectIds,
      provider: provider,
      options: { showContent: true, showDisplay: true },
    });

    if (!isPoolObjectData(objectDataList)) {
      throw new Error("Wrong shape of seed pools of bonding curve pools");
    }

    const poolIds = objectDataList.map((el) => el.data.content.fields.value);

    const livePools = await LiveCLMM.fromObjectIds({ objectIds: poolIds, provider });

    return livePools;
  }

  public async getMemeCoinPrice(memeCoinType: string): Promise<{ priceInSui: string; priceInUsd: string }> {
    const suiInputAmount = "1";

    const memeAmount = await this.quoteSwap({
      inputAmount: suiInputAmount,
      SuiToMeme: true,
      memeCoin: { coinType: memeCoinType },
      slippagePercentage: 0.01,
    });

    const suiPrice = await CoinManagerSingleton.getCoinPrice(LONG_SUI_COIN_TYPE);

    const memePriceInSui = new BigNumber(1).div(memeAmount).toString();
    const memePriceInUsd = new BigNumber(memePriceInSui).multipliedBy(suiPrice).toString();

    return { priceInSui: memePriceInSui, priceInUsd: memePriceInUsd };
  }
}
