/* eslint-disable require-jsdoc */
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SUI_DECIMALS } from "@mysten/sui.js/utils";
import { CLAMM, InterestPool } from "@interest-protocol/clamm-sdk";
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
import { normalizeInputCoinAmount } from "../bonding-pool/utils/normalizeInputCoinAmount";
import { LONG_SUI_COIN_TYPE } from "../common/sui";
import { deductSlippage } from "../bonding-pool/utils/deductSlippage";
import BigNumber from "bignumber.js";

export type LiveCLMMData = {
  poolId: string;
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
  private static SUI_TEARS_ADDRESS = "0xf7334947a5037552a94cee15fc471dbda71bf24d46c97ee24e1fdac38e26644c";
  private static CLMM_ADDRESS = "0xc9751e2b4dca6a2b1a0b4879f8add562573830dc91cb8e42f121e168602e9ac9";
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
  private constructor(private params: LiveCLMMParams) {
    this.data = params.data;
    this.clamm = new CLAMM({
      network: "mainnet",
      packageAddress: LiveCLMM.CLMM_ADDRESS,
      suiClient: params.provider,
      suiTearsAddress: LiveCLMM.SUI_TEARS_ADDRESS,
    });
  }

  private async getPool(): Promise<InterestPool> {
    if (this._pool === undefined) {
      this._pool = await this.clamm.getPool(this.data.poolId);
    }
    return this._pool;
  }

  static async fromGoLiveDefaultTx({ txDigest, provider }: { txDigest: string; provider: SuiClient }) {
    const txResult = await provider.getTransactionBlock({ digest: txDigest, options: { showObjectChanges: true } });
    console.log(txResult.objectChanges);
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

    const coinOut = await this.clamm.swap({
      coinIn,
      pool,
      txb: tx,
      coinInType: SuiToMeme ? LONG_SUI_COIN_TYPE : memeCoin.coinType,
      coinOutType: SuiToMeme ? memeCoin.coinType : LONG_SUI_COIN_TYPE,
      minAmount: minOutputBigInt,
    });

    tx.transferObjects(coinOut.coinOut, signerAddress);

    return coinOut.txb;
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

    const coinOut = await this.clamm.quoteRemoveLiquidity({
      amount: lpCoinSplitAmount,
      pool,
    });

    const outputAmount = new BigNumber(coinOut.toString()).div(10 ** parseInt(LiveCLMM.MEMECOIN_DECIMALS));
    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);
    return outputAmountRespectingSlippage.toString();
  }

  public async quoteSwap(params: QuoteSwapArgs) {
    const { memeCoin, inputAmount, SuiToMeme, slippagePercentage } = params;
    const pool = await this.getPool();

    const splitAmount = SuiToMeme
      ? normalizeInputCoinAmount(inputAmount, SUI_DECIMALS)
      : normalizeInputCoinAmount(inputAmount, parseInt(LiveCLMM.MEMECOIN_DECIMALS));

    const coinOut = await this.clamm.quoteSwap({
      amount: splitAmount,
      pool,
      coinInType: SuiToMeme ? LONG_SUI_COIN_TYPE : memeCoin.coinType,
      coinOutType: SuiToMeme ? memeCoin.coinType : LONG_SUI_COIN_TYPE,
    });

    const outputAmount = new BigNumber(coinOut.toString()).div(10 ** parseInt(LiveCLMM.MEMECOIN_DECIMALS));
    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);
    return outputAmountRespectingSlippage.toString();
  }
}
