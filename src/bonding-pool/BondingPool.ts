/* eslint-disable require-jsdoc */
import {
  NewDefaultArgs,
  isReadyToLaunch,
  newDefault,
  buyMeme,
  sellMeme,
} from "@avernikoz/memechan-ts-interface/dist/memechan/bound-curve-amm/functions";
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

import { seedPools } from "@avernikoz/memechan-ts-interface/dist/memechan/index/functions";
import { StakedLP } from "@avernikoz/memechan-ts-interface/dist/memechan/staked-lp/structs";

import { bcs } from "@mysten/sui.js/bcs";
import { SUI_CLOCK_OBJECT_ID, SUI_DECIMALS } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { CoinManagerSingleton } from "../coin/CoinManager";
import { CreateCoinTransactionParams } from "../coin/types";
import { LONG_SUI_COIN_TYPE } from "../common/sui";
import {
  CreateBondingCurvePoolParams,
  CreateCoinTransactionParamsWithoutCertainProps,
  ExtractedRegistryKeyData,
  SwapParamsForSuiInput,
  SwapParamsForSuiInputAndTicketOutput,
  SwapParamsForTicketInput,
  SwapParamsForTicketInputAndSuiOutput,
} from "./types";
import { deductSlippage } from "./utils/deductSlippage";
import { extractRegistryKeyData } from "./utils/extractRegistryKeyData";
import { getAllDynamicFields } from "./utils/getAllDynamicFields";
import { getAllObjects } from "./utils/getAllObjects";
import { getTicketDataFromCoinParams } from "./utils/getTicketDataFromCoinParams";
import { isPoolObjectData } from "./utils/isPoolObjectData";
import { isTokenPolicyCapObjectData } from "./utils/isTokenPolicyCapObjectData";
import { normalizeInputCoinAmount } from "./utils/normalizeInputCoinAmount";
import { isRegistryTableTypenameDynamicFields } from "./utils/registryTableTypenameUtils";

/**
 * @class BondingPoolSingleton
 * @implements {IBondingPool}
 * @description Singleton class for managing bonding curve pool.
 */
export class BondingPoolSingleton {
  private static _instance: BondingPoolSingleton;
  public static TX_OF_CONTRACT_DEPLOY =
    "https://suivision.xyz/txblock/yuq1Lnf1rkLp8mDGaE592yg4XkkHfShY9gpx8vqAt2A?tab=Changes";

  public static REGISTRY_OBJECT_ID = "0x16a28f0b68d3395c454bb59a32200ed863235f3902a623b14daa245c7ff680bf";
  public static ADMIN_OBJECT_ID = "0x10c2e5e3b154a187d2790092209493f204c23eca572769b3e740bb1cd068cde4";
  public static UPGRADE_CAP_OBJECT_ID = "0x4d1726a538f640974a609bfe4e4db45bc3484bf11852ffacc771d5344728671e";
  public static PACKAGE_OBJECT_ID = "0x9e1701ec8d7942a79874a40d4d5c9d94c45ffd141c9cd2cff4f4fc3820329b61";

  public static TICKET_COIN_MODULE_PREFIX = "ticket_";
  public static TICKET_COIN_NAME_PREFIX = "TicketFor";
  public static TICKET_COIN_DESCRIPTION_PREFIX = "Pre sale ticket of bonding curve pool for the following memecoin: ";

  public static MEMECOIN_DECIMALS = "6";
  public static MEMECOIN_MINT_AMOUNT = "0";
  public static MEMECOIN_FIXED_SUPPLY = false;

  public static SWAP_GAS_BUDGET = 50_000_000;

  // public static SIMULATION_ACCOUNT_ADDRESS = "0xe480f679929180f9016e4c7545f1f398640017d05ecccd96b944b7d07c97664c";
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
   * @description Gets the singleton instance of BondingPoolSingleton.
   * @param {string} [suiProviderUrl] - Url of SUI provider.
   * @return {BondingPoolSingleton} The singleton instance of BondingPoolSingleton.
   */
  public static getInstance(suiProviderUrl?: string): BondingPoolSingleton {
    if (!BondingPoolSingleton._instance) {
      if (suiProviderUrl === undefined) {
        throw new Error(
          "[BondingPoolSingleton] SUI provider url is required in arguments to create BondingPool instance.",
        );
      }

      const instance = new BondingPoolSingleton(suiProviderUrl);
      BondingPoolSingleton._instance = instance;
    }

    return BondingPoolSingleton._instance;
  }

  public static createBondingCurvePoolWithDefaultParams(
    args: NewDefaultArgs,
    typeArgs: [string, string, string],
    transaction?: TransactionBlock,
  ) {
    const tx = new TransactionBlock() ?? transaction;
    const txResult = newDefault(tx, typeArgs, args);

    return { tx, txResult };
  }

  public static createBondingCurvePool(params: CreateBondingCurvePoolParams) {
    const { memeCoin, ticketCoin, transaction } = params;
    const tx = transaction ?? new TransactionBlock();

    const createBondingCurvePoolTx = BondingPoolSingleton.createBondingCurvePoolWithDefaultParams(
      {
        registry: BondingPoolSingleton.REGISTRY_OBJECT_ID,
        memeCoinCap: memeCoin.treasureCapId,
        memeCoinMetadata: memeCoin.metadataObjectId,
        ticketCoinCap: ticketCoin.treasureCapId,
        ticketCoinMetadata: ticketCoin.metadataObjectId,
      },
      [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType],
      tx,
    );

    return createBondingCurvePoolTx;
  }

  public static async createMemeAndTicketCoins(params: CreateCoinTransactionParamsWithoutCertainProps) {
    const tx = params.transaction ?? new TransactionBlock();

    const coinCreationParams: CreateCoinTransactionParams = {
      ...params,
      decimals: BondingPoolSingleton.MEMECOIN_DECIMALS,
      fixedSupply: BondingPoolSingleton.MEMECOIN_FIXED_SUPPLY,
      mintAmount: BondingPoolSingleton.MEMECOIN_MINT_AMOUNT,

      transaction: tx,
    };

    // Create Coin TransactionBlock
    const coinTx = await CoinManagerSingleton.getCreateCoinTransaction(coinCreationParams);
    // Transform data for Ticket Coin
    const ticketFromParams = getTicketDataFromCoinParams(coinCreationParams);
    // Create Ticket Coin TransactionBlock
    const memeAndTicketCoinTx = await CoinManagerSingleton.getCreateCoinTransaction({
      ...ticketFromParams,
      transaction: coinTx,
    });

    return memeAndTicketCoinTx;
  }

  // TODO ASAP IMPORTANT: Issue? with 950 SUI Magic Number on simulation
  public async getSwapOutputAmountForSuiInput(params: SwapParamsForSuiInput) {
    const { memeCoin, ticketCoin, transaction, bondingCurvePoolObjectId, inputAmount, slippagePercentage = 0 } = params;
    const tx = transaction ?? new TransactionBlock();

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, SUI_DECIMALS);
    const suiCoinObject = tx.splitCoins(tx.gas, [inputAmountWithDecimals]);

    const txResult = buyMeme(tx, [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      pool: bondingCurvePoolObjectId,
      coinMMinValue: BigInt(1),
      coinS: suiCoinObject,
      clock: SUI_CLOCK_OBJECT_ID,
    });

    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("No results found for simulation of swap");
    }

    const returnValues = res.results[1].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }
    // console.debug("returnValues");
    // console.dir(returnValues, { depth: null });

    const rawAmountBytes = returnValues[0][0];
    const decoded = StakedLP.bcs.parse(new Uint8Array(rawAmountBytes));
    const outputRaw = decoded.balance.value;
    const outputAmount = new BigNumber(outputRaw).div(10 ** parseInt(BondingPoolSingleton.MEMECOIN_DECIMALS));

    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);

    return outputAmountRespectingSlippage.toString();
  }

  /**
   * Retrieves the output amount for swapping based on ticket input.
   * Note: This method is a work in progress and is not expected to work fully yet.
   *
   * @param {SwapParamsForTicketInput} params - Parameters for the swap.
   * @param {string} params.memeCoin - The meme coin.
   * @param {string} params.ticketCoin - The ticket coin.
   * @param {TransactionBlock=} params.transaction - The transaction block.
   * @param {string} params.bondingCurvePoolObjectId - The ID of the bonding curve pool.
   * @param {number} params.inputTicketAmount - The input ticket amount.
   * @param {number} [params.slippagePercentage=0] - The slippage percentage.
   * @return {Promise<string>} - A promise resolving to the output amount.
   */
  public async getSwapOutputAmountForTicketInput(params: SwapParamsForTicketInput): Promise<string> {
    const {
      memeCoin,
      ticketCoin,
      transaction,
      bondingCurvePoolObjectId,
      inputTicketAmount,
      slippagePercentage = 0,
    } = params;
    const tx = transaction ?? new TransactionBlock();

    const tokenPolicyObjectId = await this.getTokenPolicyByPoolId({ poolId: bondingCurvePoolObjectId.toString() });
    const inputAmountWithDecimals = normalizeInputCoinAmount(inputTicketAmount, SUI_DECIMALS);
    // TODO: Change that to actual coin
    const ticketCoinObject = tx.splitCoins(tx.gas, [inputAmountWithDecimals]);

    const txResult = sellMeme(tx, [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      pool: bondingCurvePoolObjectId,

      coinSMinValue: BigInt(1),
      policy: tokenPolicyObjectId,
      coinM: ticketCoinObject,
    });

    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("No results found for simulation of swap");
    }

    const returnValues = res.results[1].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }
    // console.debug("returnValues");
    // console.dir(returnValues, { depth: null });

    const rawAmountBytes = returnValues[0][0];
    const decoded = StakedLP.bcs.parse(new Uint8Array(rawAmountBytes));
    const outputRaw = decoded.balance.value;
    const outputAmount = new BigNumber(outputRaw).div(10 ** parseInt(BondingPoolSingleton.MEMECOIN_DECIMALS));

    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);

    return outputAmountRespectingSlippage.toString();
  }

  public static async swapSuiForTicket(params: SwapParamsForSuiInputAndTicketOutput) {
    const {
      memeCoin,
      ticketCoin,
      transaction,
      bondingCurvePoolObjectId,
      minOutputTicketAmount,
      inputAmount,
      slippagePercentage = 0,
      signerAddress,
    } = params;
    const tx = transaction ?? new TransactionBlock();

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, SUI_DECIMALS);
    const [suiCoinObject] = tx.splitCoins(tx.gas, [inputAmountWithDecimals]);

    // output
    // Note: Be aware, we relay on the fact that `MEMECOIN_DECIMALS` would be always set same for all memecoins
    // As well as the fact that memecoins and tickets decimals are always the same
    const minOutputWithSlippage = deductSlippage(new BigNumber(minOutputTicketAmount), slippagePercentage);
    const minOutputNormalized = normalizeInputCoinAmount(
      minOutputWithSlippage.toString(),
      +BondingPoolSingleton.MEMECOIN_DECIMALS,
    );
    const minOutputBigInt = BigInt(minOutputNormalized);

    const txResult = buyMeme(tx, [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      pool: bondingCurvePoolObjectId,
      coinMMinValue: minOutputBigInt,
      coinS: suiCoinObject,
      clock: SUI_CLOCK_OBJECT_ID,
    });

    tx.transferObjects([suiCoinObject], tx.pure(signerAddress));
    tx.transferObjects([txResult], tx.pure(signerAddress));
    tx.setGasBudget(BondingPoolSingleton.SWAP_GAS_BUDGET);

    return { tx, txResult };
  }

  public static async swapTicketForSui(params: SwapParamsForTicketInputAndSuiOutput) {
    const {
      memeCoin,
      ticketCoin,
      transaction,
      bondingCurvePoolObjectId,
      minOutputSuiAmount,
      inputAmount,
      slippagePercentage = 0,
      signerAddress,
    } = params;
    const tx = transaction ?? new TransactionBlock();

    const tokenPolicyObjectId = await BondingPoolSingleton.getInstance().getTokenPolicyByPoolId({
      poolId: bondingCurvePoolObjectId.toString(),
    });
    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, SUI_DECIMALS);
    // TODO: Change that to actual coin
    const ticketCoinObject = tx.splitCoins(tx.gas, [inputAmountWithDecimals]);

    const minOutputWithSlippage = deductSlippage(new BigNumber(minOutputSuiAmount), slippagePercentage);
    const minOutputNormalized = normalizeInputCoinAmount(minOutputWithSlippage.toString(), SUI_DECIMALS);
    const minOutputBigInt = BigInt(minOutputNormalized);

    const txResult = sellMeme(tx, [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      pool: bondingCurvePoolObjectId,
      coinSMinValue: minOutputBigInt,
      policy: tokenPolicyObjectId,
      coinM: ticketCoinObject,
    });

    tx.transferObjects([ticketCoinObject], tx.pure(signerAddress));
    tx.transferObjects([txResult], tx.pure(signerAddress));
    tx.setGasBudget(BondingPoolSingleton.SWAP_GAS_BUDGET);

    return { tx, txResult };
  }

  public async getRegistryTableAddress({ transaction }: { transaction?: TransactionBlock } = {}) {
    const tx = transaction ?? new TransactionBlock();
    const txResult = seedPools(tx, BondingPoolSingleton.REGISTRY_OBJECT_ID);
    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });
    if (!res.results) {
      throw new Error("No results found for all bonding curve pools");
    }
    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }

    const registryTableAddress = returnValues[0][0];
    const decodedTableAddress: string = bcs.de("address", new Uint8Array(registryTableAddress));

    return decodedTableAddress;
  }

  public async getAllPools({ transaction }: { transaction?: TransactionBlock } = {}) {
    const registryTableId = await this.getRegistryTableAddress({ transaction });

    const tableDynamicFields = await getAllDynamicFields({
      parentObjectId: registryTableId,
      provider: this.provider,
    });

    if (!isRegistryTableTypenameDynamicFields(tableDynamicFields)) {
      throw new Error("Wrong shape of typename dynamic fields of bonding curve registry table");
    }

    const typenameObjectIdsMap = tableDynamicFields.reduce(
      (acc: { [objectId: string]: { objectId: string; registryKeyType: string } }, el) => {
        acc[el.objectId] = { objectId: el.objectId, registryKeyType: el.name.value.name };

        return acc;
      },
      {},
    );

    const tableTypenameObjectIds = Object.keys(typenameObjectIdsMap);

    const objectDataList = await getAllObjects({
      objectIds: tableTypenameObjectIds,
      provider: this.provider,
      options: { showContent: true, showDisplay: true },
    });

    if (!isPoolObjectData(objectDataList)) {
      throw new Error("Wrong shape of seed pools of bonding curve pools");
    }

    const pools = objectDataList.map((el) => ({
      objectId: el.data.content.fields.value,
      typename: el.data.content.fields.name.fields.name,
      // TODO: Add pools data (e.g. CoinX, CoinY, Meme) when contract would be upgraded
      ...extractRegistryKeyData(el.data.content.fields.name.fields.name),
    }));

    const poolIds = pools.map((el) => el.objectId);
    const poolsByTicketCoinTypeMap = pools.reduce(
      (acc: { [ticketCoinType: string]: ExtractedRegistryKeyData & { objectId: string; typename: string } }, el) => {
        acc[el.ticketCoinType] = { ...el };

        return acc;
      },
      {},
    );

    return { poolIds, pools, poolsByTicketCoinTypeMap };
  }

  public async getPoolByTicket({ ticketCoin }: { ticketCoin: { coinType: string } }) {
    const allPools = await this.getAllPools();
    const pool = allPools.poolsByTicketCoinTypeMap[ticketCoin.coinType];

    if (!pool) {
      throw new Error(`No such pool found for provided ticketCoin coinType ${ticketCoin.coinType}`);
    }

    return pool;
  }

  public async isMemeCoinReadyToLivePhase({
    transaction,
    memeCoin,
    ticketCoin,
    poolId,
  }: {
    memeCoin: { coinType: string };
    ticketCoin: { coinType: string };
    poolId: string;
    transaction?: TransactionBlock;
  }) {
    const tx = transaction ?? new TransactionBlock();
    const txResult = isReadyToLaunch(tx, [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType], poolId);

    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("No results found for all bonding curve pools");
    }
    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }

    const isReadyToLivePhaseRaw = returnValues[0][0];
    const decodedIsReadyToLivePhase: string = bcs.de("bool", new Uint8Array(isReadyToLivePhaseRaw));

    return decodedIsReadyToLivePhase;
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
