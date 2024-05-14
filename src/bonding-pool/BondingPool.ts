/* eslint-disable require-jsdoc */
import {
  NewArgs,
  NewDefaultArgs,
  accountingLen,
  buyMeme,
  isReadyToLaunch,
  newDefault,
  new_,
  quoteBuyMeme,
  quoteSellMeme,
  sellMeme,
  takeFees,
  transfer,
} from "@avernikoz/memechan-ts-interface/dist/memechan/seed-pool/functions";

import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

import { seedPools } from "@avernikoz/memechan-ts-interface/dist/memechan/index/functions";

import { goLive, goLiveDefault } from "@avernikoz/memechan-ts-interface/dist/memechan/go-live/functions";
import { bcs } from "@mysten/sui.js/bcs";
import { SUI_CLOCK_OBJECT_ID, SUI_DECIMALS } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { CoinManagerSingleton } from "../coin/CoinManager";
import { CreateCoinTransactionParams } from "../coin/types";
import { LONG_SUI_COIN_TYPE } from "../common/sui";
import { getMergedToken } from "../common/tokens";
import {
  BondingCurveCustomParams,
  CreateBondingCurvePoolParams,
  CreateCoinTransactionParamsWithoutCertainProps,
  DetailedPoolInfo,
  ExtractedRegistryKeyData,
  GetAllPoolsMapByMemeCoinType,
  GetAllPoolsMapByPoolObjectIdType,
  GetBondingCurveCustomParams,
  InitSecondaryMarketCustomParams,
  InitSecondaryMarketParams,
  ObjectIdsByAddressMapType,
  StakedLpObject,
  SwapParamsForSuiInput,
  SwapParamsForSuiInputAndTicketOutput,
  SwapParamsForTicketInput,
  SwapParamsForTicketInputAndSuiOutput,
  VestingDataInfo,
} from "./types";
import { deductSlippage } from "./utils/deductSlippage";
import { extractCoinType } from "./utils/extractCoinType";
import { extractRegistryKeyData } from "./utils/extractRegistryKeyData";
import { getAllDynamicFields } from "./utils/getAllDynamicFields";
import { getAllObjects } from "./utils/getAllObjects";
import { getAllOwnedObjects } from "./utils/getAllOwnedObjects";
import { isPoolDetailedInfo, isPoolDetailedInfoList } from "./utils/isPoolDetailedInfo";
import { isPoolObjectData } from "./utils/isPoolObjectData";
import { isStakedLpObjectDataList } from "./utils/isStakedLpObjectData";
import { isVestingDataInfoList } from "./utils/isVestingData";
import { normalizeInputCoinAmount } from "./utils/normalizeInputCoinAmount";
import { isRegistryTableTypenameDynamicFields } from "./utils/registryTableTypenameUtils";
import { GetMemeCoinPriceOutput } from "../live/types";

/**
 * @class BondingPoolSingleton
 * @implements {IBondingPool}
 * @description Singleton class for managing bonding curve pool.
 */
export class BondingPoolSingleton {
  private static _instance: BondingPoolSingleton;
  public static TX_OF_CONTRACT_DEPLOY =
    "https://suivision.xyz/txblock/Go74v6ArwtVF4dGvE4ApbhEjmtuza3p95XvTdhwnAgo8?tab=Changes";

  public static SUI_METADATA_OBJECT_ID = "0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3";

  public static PACKAGE_OBJECT_ID = "0xc48ce784327427802e1f38145c65b4e5e0a74c53187fca4b9ca0d4ca47da68b1";
  public static UPGRADE_CAP_OBJECT_ID = "0x92eb213f2034a57114436d5417ff0fbb8770142bd23ae1f32fde4b53c38fd09b";
  public static REGISTRY_OBJECT_ID = "0x7ee8efddc3355a458dc19e2e32d3dc5a196a87b8019301264491197e2aa15b86";
  public static ADMIN_OBJECT_ID = "0x13e56101fe4c9b2c84974bb7790db7fa08656b40323529000e87eb7665e541fe";
  // TODO: Move that to StakingPool
  public static STAKING_MODULE_NAME = "staked_lp";
  public static STAKING_LP_STRUCT_TYPE = "StakedLP";
  // eslint-disable-next-line max-len
  public static STAKED_LP_OBJECT_TYPE = `${BondingPoolSingleton.PACKAGE_OBJECT_ID}::${BondingPoolSingleton.STAKING_MODULE_NAME}::${BondingPoolSingleton.STAKING_LP_STRUCT_TYPE}`;

  public static TICKET_COIN_MODULE_PREFIX = "ticket_";
  public static TICKET_COIN_NAME_PREFIX = "TicketFor";
  public static TICKET_COIN_DESCRIPTION_PREFIX = "Pre sale ticket of bonding curve pool for the following memecoin: ";

  public static MEMECOIN_DECIMALS = "6";
  public static MEMECOIN_MINT_AMOUNT = "0";
  public static MEMECOIN_FIXED_SUPPLY = false;

  // contract consts               8_3333_333_333_333
  public static DEFAULT_MAX_M_LP = 200_000_000_000_000;
  public static DEFAULT_MAX_M = 900_000_000_000_000;

  public static MEMECOIN_MINT_AMOUNT_FROM_CONTRACT = new BigNumber(BondingPoolSingleton.DEFAULT_MAX_M_LP)
    .plus(BondingPoolSingleton.DEFAULT_MAX_M)
    .div(10 ** +BondingPoolSingleton.MEMECOIN_DECIMALS)
    .toString();

  public static TICKET_COIN_DECIMALS = BondingPoolSingleton.MEMECOIN_DECIMALS;

  // TODO: Change these values
  public static AMM_LP_COIN_DECIMALS = "9";
  public static AMM_LP_COIN_MODULE_PREFIX = "lp_coin";
  public static AMM_LP_COIN_NAME_PREFIX = "LpCoin";
  public static AMM_LP_COIN_DESCRIPTION_PREFIX = "Lp coin for CLMM pool";
  public static AMM_LP_COIN_MINT_AMOUNT = "0";

  // TODO: Re-visit this
  public static STAKED_LP_COIN_DECIMALS = BondingPoolSingleton.MEMECOIN_DECIMALS;

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
    typeArgs: [string, string],
    transaction?: TransactionBlock,
  ) {
    const tx = new TransactionBlock() ?? transaction;
    const txResult = newDefault(tx, typeArgs, args);

    return { tx, txResult };
  }

  public static createBondingCurvePoolWithCustomParams(
    args: NewArgs,
    typeArgs: [string, string],
    transaction?: TransactionBlock,
  ) {
    const tx = new TransactionBlock() ?? transaction;
    const txResult = new_(tx, typeArgs, args);

    return { tx, txResult };
  }

  public static getBondingCurveCustomParams(params: GetBondingCurveCustomParams): BondingCurveCustomParams {
    // TODO: Later on we can fetch these values on-chain by using tx simulation with devInspect
    const DEFAULT_ADMIN_FEE = BigInt(5_000_000_000_000_000); // 0.5%
    const DEFAULT_PRICE_FACTOR = BigInt(2);
    const DEFAULT_MAX_M_LP = BigInt(200_000_000_000_000);
    const DEFAULT_MAX_M = BigInt(900_000_000_000_000);
    const DEFAULT_MAX_S = BigInt(30_000);
    const DEFAULT_SELL_DELAY_MS = BigInt(12 * 3600 * 1000);

    return {
      feeInPercent: params.feeInPercent ?? DEFAULT_ADMIN_FEE,
      feeOutPercent: params.feeOutPercent ?? DEFAULT_ADMIN_FEE,
      gammaS: params.gammaS ?? DEFAULT_MAX_S,
      gammaM: params.gammaM ?? DEFAULT_MAX_M,
      omegaM: params.omegaM ?? DEFAULT_MAX_M_LP,
      priceFactor: params.priceFactor ?? DEFAULT_PRICE_FACTOR,
      sellDelayMs: params.sellDelayMs ?? DEFAULT_SELL_DELAY_MS,
    };
  }

  public static createBondingCurvePool(params: CreateBondingCurvePoolParams) {
    const { memeCoin, transaction, bondingCurveCustomParams } = params;
    const tx = transaction ?? new TransactionBlock();

    if (bondingCurveCustomParams) {
      const createBondingCurvePoolTxResult = BondingPoolSingleton.createBondingCurvePoolWithCustomParams(
        {
          registry: BondingPoolSingleton.REGISTRY_OBJECT_ID,
          memeCoinCap: memeCoin.treasureCapId,
          ...bondingCurveCustomParams,
        },
        [LONG_SUI_COIN_TYPE, memeCoin.coinType],
        tx,
      );

      return createBondingCurvePoolTxResult;
    } else {
      const createBondingCurvePoolTx = BondingPoolSingleton.createBondingCurvePoolWithDefaultParams(
        {
          registry: BondingPoolSingleton.REGISTRY_OBJECT_ID,
          memeCoinCap: memeCoin.treasureCapId,
        },
        [LONG_SUI_COIN_TYPE, memeCoin.coinType],
        tx,
      );
      return createBondingCurvePoolTx;
    }
  }

  public static async createMemeCoin(params: CreateCoinTransactionParamsWithoutCertainProps) {
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

    return coinTx;
  }

  public static async getAllStakedLPObjectsByOwner({ owner, provider }: { owner: string; provider: SuiClient }) {
    const stakedLpObjects = await getAllOwnedObjects({
      provider: provider,
      options: {
        owner: owner,
        // TODO: (?) Might require update to support multiple packages for STAKED_LP_OBJECT_TYPE
        filter: { StructType: BondingPoolSingleton.STAKED_LP_OBJECT_TYPE },
        options: {
          showContent: true,
          showType: true,
        },
      },
    });

    if (!isStakedLpObjectDataList(stakedLpObjects)) {
      throw new Error("[getAllStakedLPObjectsByOwner] Wrong shape of staked lp objects");
    }

    const stakedLpObjectList: StakedLpObject[] = stakedLpObjects.map((el) => ({
      objectId: el.data.objectId,
      type: el.data.type,
      balance: el.data.content.fields.balance,
      // Note: we relay that memecoin decimals and ticket coin decimals are always equal,
      // otherwise we'll need to fetch meta to get decimals for each ticket
      balanceWithDecimals: new BigNumber(el.data.content.fields.balance)
        .dividedBy(10 ** +BondingPoolSingleton.STAKED_LP_COIN_DECIMALS)
        .toString(),
      untilTimestamp: +el.data.content.fields.until_timestamp,
      memeCoinType: extractCoinType(el.data.type),
    }));

    const stakedLpObjectsByMemeCoinTypeMap = stakedLpObjectList.reduce(
      (acc: { [memeCoinType: string]: StakedLpObject[] }, el) => {
        if (acc[el.memeCoinType]) {
          acc[el.memeCoinType] = [...acc[el.memeCoinType], el];
        } else {
          acc[el.memeCoinType] = [el];
        }

        return acc;
      },
      {},
    );

    return { stakedLpObjectList, stakedLpObjectsByMemeCoinTypeMap };
  }

  public async getAvailableStakedLpByOwner({ owner }: { owner: string }) {
    const allStakedLpsByOwner = await BondingPoolSingleton.getAllStakedLPObjectsByOwner({
      owner,
      provider: this.provider,
    });
    const currentTimestampMs = Date.now();
    const availableStakedLps = allStakedLpsByOwner.stakedLpObjectList.filter(
      (el) => currentTimestampMs > el.untilTimestamp,
    );

    const availableStakedLpObjectsByMemeCoinTypeMap = availableStakedLps.reduce(
      (acc: { [memeCoinType: string]: StakedLpObject[] }, el) => {
        if (acc[el.memeCoinType]) {
          acc[el.memeCoinType] = [...acc[el.memeCoinType], el];
        } else {
          acc[el.memeCoinType] = [el];
        }

        return acc;
      },
      {},
    );

    return { availableStakedLps, availableStakedLpObjectsByMemeCoinTypeMap };
  }

  public async getAvailableAmountOfTicketsToSell({
    owner,
    memeCoin,
  }: {
    owner: string;
    memeCoin: { coinType: string };
  }) {
    const { availableStakedLpObjectsByMemeCoinTypeMap } = await this.getAvailableStakedLpByOwner({
      owner,
    });
    const availableTickets = availableStakedLpObjectsByMemeCoinTypeMap[memeCoin.coinType] ?? [];

    const aggregatedAmount = availableTickets.reduce(
      (acc: BigNumber, el) => acc.plus(new BigNumber(el.balance)),
      new BigNumber(0),
    );

    return {
      amount: aggregatedAmount.toString(),
      amountWithDecimals: aggregatedAmount.div(10 ** +BondingPoolSingleton.STAKED_LP_COIN_DECIMALS),
      tickets: availableTickets,
    };
  }

  public async getSwapOutputAmountForSuiInput(params: SwapParamsForSuiInput) {
    const { memeCoin, transaction, bondingCurvePoolObjectId, inputAmount, slippagePercentage = 0 } = params;
    const tx = transaction ?? new TransactionBlock();

    const inputAmountWithDecimals = normalizeInputCoinAmount(inputAmount, SUI_DECIMALS);

    // Please note, mutation of `tx` happening below
    quoteBuyMeme(tx, [LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      coinS: inputAmountWithDecimals,
      pool: bondingCurvePoolObjectId,
    });

    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("No results found for simulation of swap");
    }

    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }

    const rawAmountBytes = returnValues[0][0];
    const decoded = bcs.de("u64", new Uint8Array(rawAmountBytes));
    const outputRaw = decoded;
    const outputAmount = new BigNumber(outputRaw).div(10 ** parseInt(BondingPoolSingleton.MEMECOIN_DECIMALS));

    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);

    return outputAmountRespectingSlippage.toString();
  }

  // TODO: update eslint jsdoc for that method
  // eslint-disable-next-line valid-jsdoc
  /**
   * Be aware, that this method could return 0 in case there is no sui in pool
   * (that might be a case when pool just launched)
   * That case should be handled on the client-side
   */
  public async getSwapOutputAmountForTicketInput(params: SwapParamsForTicketInput) {
    const { bondingCurvePoolObjectId, inputTicketAmount, slippagePercentage = 0, transaction, memeCoin } = params;
    const tx = transaction ?? new TransactionBlock();

    const inputAmountWithDecimals = normalizeInputCoinAmount(
      inputTicketAmount,
      +BondingPoolSingleton.TICKET_COIN_DECIMALS,
    );

    // Please note, mutation of `tx` happening below
    quoteSellMeme(tx, [LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      coinM: inputAmountWithDecimals,
      pool: bondingCurvePoolObjectId,
    });

    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("No results found for simulation of swap");
    }

    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }

    // console.debug("returnValues");
    // console.dir(returnValues, { depth: null });

    const rawAmountBytes = returnValues[0][0];
    const decoded = bcs.de("u64", new Uint8Array(rawAmountBytes));
    const outputRaw = decoded;
    const outputAmount = new BigNumber(outputRaw).div(10 ** SUI_DECIMALS);

    const outputAmountRespectingSlippage = deductSlippage(outputAmount, slippagePercentage);

    return outputAmountRespectingSlippage.toString();
  }

  public static async swapSuiForTicket(params: SwapParamsForSuiInputAndTicketOutput) {
    const {
      memeCoin,
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

    const txResult = buyMeme(tx, [LONG_SUI_COIN_TYPE, memeCoin.coinType], {
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

  public async swapTicketForSui(params: SwapParamsForTicketInputAndSuiOutput) {
    const {
      memeCoin,
      transaction,
      bondingCurvePoolObjectId,
      inputTicketAmount,
      slippagePercentage = 0,
      signerAddress: owner,
      minOutputSuiAmount,
    } = params;
    const tx = transaction ?? new TransactionBlock();

    const { amountWithDecimals, tickets: availableTokens } = await this.getAvailableAmountOfTicketsToSell({
      owner,
      memeCoin,
    });

    const isInputTicketAmountIsLargerThanAvailable = new BigNumber(inputTicketAmount).isGreaterThan(
      new BigNumber(amountWithDecimals),
    );

    if (isInputTicketAmountIsLargerThanAvailable) {
      throw new Error(
        "Provided inputTicketAmount is larger than available ticket amount for sell. " +
          `Available ticket amount: ${amountWithDecimals}`,
      );
    }

    const tokenPolicyObjectId = await this.getTokenPolicyByPoolId({ poolId: bondingCurvePoolObjectId.toString() });
    const inputAmountWithDecimals = normalizeInputCoinAmount(
      inputTicketAmount,
      +BondingPoolSingleton.TICKET_COIN_DECIMALS,
    );
    const remainingAmountBN = new BigNumber(inputAmountWithDecimals.toString());

    const tokenObject = getMergedToken({
      remainingAmountBN,
      availableTokens: availableTokens.map((t) => ({
        coinType: t.memeCoinType,
        balance: t.balance,
        objectId: t.objectId,
      })),
      tokenPolicyObjectId,
      memeCoinType: memeCoin.coinType,
      transaction: tx,
    });

    // output
    // Note: Be aware, we relay on the fact that all pools are paired with `SUI`
    // and it would be always set same for all memecoins
    const minOutputWithSlippage = deductSlippage(new BigNumber(minOutputSuiAmount), slippagePercentage);
    const minOutputNormalized = normalizeInputCoinAmount(minOutputWithSlippage.toString(), SUI_DECIMALS);

    const txResult = sellMeme(tx, [LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      pool: bondingCurvePoolObjectId,
      coinSMinValue: minOutputNormalized,
      policy: tokenPolicyObjectId,
      coinM: tokenObject,
    });

    const [suiCoin] = txResult;

    tx.transferObjects([suiCoin], owner);
    tx.setGasBudget(BondingPoolSingleton.SWAP_GAS_BUDGET);

    return { tx, txResult };
  }

  public async getRegistryTableAddress({ transaction }: { transaction?: TransactionBlock } = {}) {
    const tx = transaction ?? new TransactionBlock();
    // Please note, mutation of `tx` happening below
    seedPools(tx, BondingPoolSingleton.REGISTRY_OBJECT_ID);
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

  public async getPoolDetailedInfo({ poolId }: { poolId: string }): Promise<DetailedPoolInfo> {
    const poolObject = await this.provider.getObject({
      id: poolId,
      options: { showContent: true, showOwner: true, showType: true },
    });

    if (!isPoolDetailedInfo(poolObject)) {
      throw new Error("Wrong shape of detailed pool object info");
    }

    return poolObject;
  }

  public async getAllPoolsCommon({ transaction }: { transaction?: TransactionBlock } = {}) {
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
      options: { showContent: true, showDisplay: true, showType: true },
    });

    if (!isPoolObjectData(objectDataList)) {
      throw new Error("Wrong shape of seed pools of bonding curve pools");
    }

    const pools = objectDataList.map((el) => ({
      objectId: el.data.content.fields.value,
      typename: el.data.content.fields.name.fields.name,
      ...extractRegistryKeyData(el.data.content.fields.name.fields.name),
    }));

    const poolIds = pools.map((el) => el.objectId);

    return { pools, poolIds };
  }

  public async getAllPools({ transaction }: { transaction?: TransactionBlock } = {}) {
    const { pools, poolIds } = await this.getAllPoolsCommon();

    const poolsByMemeCoinTypeMap = pools.reduce(
      (acc: { [memeCoinType: string]: ExtractedRegistryKeyData & { objectId: string; typename: string } }, el) => {
        acc[el.memeCoinType] = { ...el };

        return acc;
      },
      {},
    );

    const poolsByPoolId = pools.reduce(
      (acc: { [objectId: string]: ExtractedRegistryKeyData & { objectId: string; typename: string } }, el) => {
        acc[el.objectId] = { ...el };

        return acc;
      },
      {},
    );

    return { poolIds, pools, poolsByMemeCoinTypeMap, poolsByPoolId };
  }

  /**
   * Retrieves all pools with detailed information.
   *
   * @param {Object} options - Options for the query.
   * @param {TransactionBlock} [options.transaction] - Optional transaction block for database transactions.
   * @return {Promise<Array<Pool>>} - A Promise that resolves to an array of pools with detailed information.
   * @warns {string} This method retrieves pools with detailed information only.
   * This includes bonding curve pools that have not yet had the 'go_live' method triggered,
   * such as bonding curve pools that are still in the pre-sale phase.
   * Be aware, that once pre-sale phase is finished, bonding pool object got destroyed (deleted) on-chain.
   */
  public async getAllPoolsWithDetailedInfo({ transaction }: { transaction?: TransactionBlock } = {}) {
    const { pools, poolIds } = await this.getAllPoolsCommon();

    const poolsObjectDataList = await getAllObjects({
      objectIds: poolIds,
      provider: this.provider,
      options: { showContent: true, showType: true, showOwner: true },
    });

    // Filter out pools that deleted because they are already live
    const filtredPoolsObjectDataList = poolsObjectDataList.filter(
      (el) => el.error?.code !== "notExists" && el.error?.code !== "deleted",
    );

    if (!isPoolDetailedInfoList(filtredPoolsObjectDataList)) {
      throw new Error("Pools shape doesn't match detailed info list shape");
    }

    const detailedInfoPoolsMapById = filtredPoolsObjectDataList.reduce(
      (acc: { [poolObjectId: string]: DetailedPoolInfo }, el) => {
        acc[el.data.objectId] = { ...el };

        return acc;
      },
      {},
    );

    const filtredPools = pools.filter((el) => detailedInfoPoolsMapById[el.objectId]);

    const poolsByMemeCoinTypeMap = filtredPools.reduce((acc: GetAllPoolsMapByMemeCoinType, el) => {
      const detailedPoolInfo = detailedInfoPoolsMapById[el.objectId];

      acc[el.memeCoinType] = { ...el, detailedPoolInfo };

      return acc;
    }, {});

    const poolsByPoolId = filtredPools.reduce((acc: GetAllPoolsMapByPoolObjectIdType, el) => {
      const detailedPoolInfo = detailedInfoPoolsMapById[el.objectId];

      acc[el.objectId] = { ...el, detailedPoolInfo };

      return acc;
    }, {});

    const poolsWithDetailedInfo = filtredPools.map((el) => {
      const detailedPoolInfo = detailedInfoPoolsMapById[el.objectId];

      return {
        ...el,
        detailedPoolInfo,
      };
    });

    return { poolIds, pools: poolsWithDetailedInfo, poolsByMemeCoinTypeMap, poolsByPoolId };
  }

  public async getPoolByMeme({ memeCoin }: { memeCoin: { coinType: string } }) {
    const allPools = await this.getAllPools();
    const pool = allPools.poolsByMemeCoinTypeMap[memeCoin.coinType];

    if (!pool) {
      throw new Error(`No such pool found for provided memeCoin coinType ${memeCoin.coinType}`);
    }

    return pool;
  }

  public async isMemeCoinReadyToLivePhase({
    transaction,
    memeCoin,
    poolId,
  }: {
    memeCoin: { coinType: string };
    poolId: string;
    transaction?: TransactionBlock;
  }): Promise<boolean> {
    const tx = transaction ?? new TransactionBlock();

    // Please note, mutation of `tx` happening below
    isReadyToLaunch(tx, [LONG_SUI_COIN_TYPE, memeCoin.coinType], poolId);

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
    const decodedIsReadyToLivePhase: boolean = bcs.de("bool", new Uint8Array(isReadyToLivePhaseRaw));

    return decodedIsReadyToLivePhase;
  }

  public async getTokenPolicyByPoolId({ poolId }: { poolId: string }) {
    const poolDetailedInfo = await this.getPoolDetailedInfo({ poolId });
    const tokenPolicyObjectId = poolDetailedInfo.data.content.fields.policy_cap.fields.for;

    if (!tokenPolicyObjectId) {
      throw new Error(`[getTokenPolicyByPoolId] No token policy found for ${poolId}`);
    }

    return tokenPolicyObjectId;
  }

  public static getLpCoinCreateParams({ signer }: { signer: string }): CreateCoinTransactionParams {
    return {
      // TODO: Change all these values to make it look as a lp coin
      decimals: BondingPoolSingleton.AMM_LP_COIN_DECIMALS,
      description: BondingPoolSingleton.AMM_LP_COIN_DESCRIPTION_PREFIX,
      fixedSupply: false,
      mintAmount: BondingPoolSingleton.AMM_LP_COIN_MINT_AMOUNT,
      name: BondingPoolSingleton.AMM_LP_COIN_NAME_PREFIX,
      signerAddress: signer,
      symbol: BondingPoolSingleton.AMM_LP_COIN_MODULE_PREFIX,
      // TODO: Add LP COIN URL
      url: "",
    };
  }

  public static initSecondaryMarket(params: InitSecondaryMarketParams) {
    const tx = params.transaction ?? new TransactionBlock();

    const txResult = goLiveDefault(tx, [params.memeCoinType, params.lpCoinType], {
      registry: params.registry,
      adminCap: params.adminCap,
      seedPool: params.seedPool,
      suiMeta: params.suiMetadataObject,
      memeMeta: params.memeMeta,
      lpMeta: params.lpMeta,
      clock: SUI_CLOCK_OBJECT_ID,
      treasuryCap: params.lpCoinTreasureCapId,
    });

    return { tx, txResult };
  }

  public static initSecondaryMarketWithCustomParams(params: InitSecondaryMarketCustomParams) {
    const tx = params.transaction ?? new TransactionBlock();

    const txResult = goLive(tx, [params.memeCoinType, params.lpCoinType], {
      registry: params.registry,
      adminCap: params.adminCap,
      seedPool: params.seedPool,
      suiMeta: params.suiMetadataObject,
      memeMeta: params.memeMeta,
      lpMeta: params.lpMeta,
      clock: SUI_CLOCK_OBJECT_ID,
      treasuryCap: params.lpCoinTreasureCapId,
      cliffDelta: params.cliffDelta,
      endVestingDelta: params.endVestingDelta,
    });

    return { tx, txResult };
  }

  public async getInitSecondaryMarketData(params: { poolId: string }) {
    const { poolId } = params;
    const { poolsByPoolId } = await this.getAllPools();
    const pool = poolsByPoolId[poolId];

    const instance = CoinManagerSingleton.getInstance(this.suiProviderUrl);
    const memeMetaDataPromise = instance.fetchCoinMetadata(pool.memeCoinType);

    const [memeMetaData] = await Promise.all([memeMetaDataPromise]);

    if (!memeMetaData) {
      throw new Error("Meme metadata is null");
    }

    const memeMetaDataObjectId = memeMetaData.id;

    if (!memeMetaDataObjectId) {
      throw new Error("Meme id is empty");
    }

    return {
      registry: BondingPoolSingleton.REGISTRY_OBJECT_ID,
      adminCap: BondingPoolSingleton.ADMIN_OBJECT_ID,
      seedPool: pool.objectId,
      memeMeta: memeMetaDataObjectId,
      memeCoinType: pool.memeCoinType,
      suiMetadataObject: BondingPoolSingleton.SUI_METADATA_OBJECT_ID,
    };
  }

  public async getUniqHoldersOfStakedLpCount({
    transaction,
    memeCoin,
    bondingCurvePoolObjectId,
  }: {
    transaction?: TransactionBlock;
    memeCoin: { coinType: string };
    bondingCurvePoolObjectId: string;
  }): Promise<string> {
    const tx = transaction ?? new TransactionBlock();

    // Please note, mutation of `tx` happening below
    accountingLen(tx, [LONG_SUI_COIN_TYPE, memeCoin.coinType], bondingCurvePoolObjectId);

    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMULATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("[getUniqHoldersOfStakedLpCount] No results found for simulation of");
    }

    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("[getUniqHoldersOfStakedLpCount] Return values are undefined");
    }

    const rawAmountBytes = returnValues[0][0];
    const decoded: number = bcs.de("u64", new Uint8Array(rawAmountBytes));

    return decoded.toString();
  }

  // TODO: Candidate to move to the BE
  public async getUniqHoldersOfStakedLp({
    accountingTableAddress,
    transaction,
  }: {
    transaction?: TransactionBlock;
    accountingTableAddress: string;
  }): Promise<VestingDataInfo[]> {
    const dfs = await getAllDynamicFields({
      parentObjectId: accountingTableAddress,
      provider: this.provider,
    });

    const objectIdsByAddressMap: ObjectIdsByAddressMapType = dfs.reduce((acc: ObjectIdsByAddressMapType, el) => {
      const address = el.name.value as string;
      acc[address] = el.objectId;

      return acc;
    }, {});

    const objectIds = Object.values(objectIdsByAddressMap);

    const objectDataList = await getAllObjects({
      objectIds: objectIds,
      provider: this.provider,
      options: { showContent: true, showDisplay: true },
    });

    if (!isVestingDataInfoList(objectDataList)) {
      throw new Error("Wrong shape of vesting data info of bonding curve pools");
    }

    // TODO: Maybe we should process it a bit, but not now

    return objectDataList;
  }

  /**
   * Gets the price of a meme coin in SUI and USD for the bonding curve pool.
   * @param {string} memeCoinType - The type of meme coin.
   * @return {Promise<GetMemeCoinPriceOutput>} The price of the meme coin in SUI and USD.
   * @deprecated This method is deprecated. Please use getMemeCoinPrice2 instead.
   */
  public async getMemeCoinPrice(memeCoinType: string): Promise<GetMemeCoinPriceOutput> {
    const memePool = await this.getPoolByMeme({ memeCoin: { coinType: memeCoinType } });

    const poolDetails = await this.getPoolDetailedInfo({ poolId: memePool.objectId });

    const memePoolBalance = poolDetails.data.content.fields.balance_m;
    const suiPoolBalance = poolDetails.data.content.fields.balance_s;

    const suiBalanceInPoolConverted = new BigNumber(suiPoolBalance).div(10 ** SUI_DECIMALS);
    const soldMemeAmountConverted = new BigNumber(BondingPoolSingleton.DEFAULT_MAX_M)
      .minus(memePoolBalance)
      .div(10 ** +BondingPoolSingleton.MEMECOIN_DECIMALS);

    const memePriceInSui = suiBalanceInPoolConverted.div(soldMemeAmountConverted);

    const suiPrice = await CoinManagerSingleton.getCoinPrice(LONG_SUI_COIN_TYPE); // 1.08
    const memePriceInUsd = new BigNumber(memePriceInSui).multipliedBy(suiPrice).toString();

    return { priceInSui: memePriceInSui.toString(), priceInUsd: memePriceInUsd };
  }

  /**
   * Gets the price of a meme coin in SUI and USD for the bonding curve pool.
   * @param {Object} options - The options object.
   * @param {string} options.memeCoinType - The type of meme coin.
   * @param {number} options.suiPrice - The price of SUI.
   * @return {Promise<GetMemeCoinPriceOutput>} The price of the meme coin in SUI and USD.
   */
  public async getMemeCoinPrice2({
    memeCoinType,
    suiPrice,
  }: {
    memeCoinType: string;
    suiPrice: number;
  }): Promise<GetMemeCoinPriceOutput> {
    const memePool = await this.getPoolByMeme({ memeCoin: { coinType: memeCoinType } });

    const poolDetails = await this.getPoolDetailedInfo({ poolId: memePool.objectId });
    const { priceInSui, priceInUsd } = BondingPoolSingleton.getMemeCoinPriceFromPoolDetails({ poolDetails, suiPrice });

    return { priceInSui, priceInUsd };
  }

  public static getMemeMarketCap({ memeCoinPriceInUSD }: { memeCoinPriceInUSD: string }) {
    const marketCap = new BigNumber(BondingPoolSingleton.MEMECOIN_MINT_AMOUNT_FROM_CONTRACT).multipliedBy(
      new BigNumber(memeCoinPriceInUSD),
    );

    return marketCap.toString();
  }

  public static getMemeCoinPriceFromPoolDetails({
    poolDetails,
    suiPrice,
  }: {
    poolDetails: DetailedPoolInfo;
    suiPrice: number;
  }) {
    const memePoolBalance = poolDetails.data.content.fields.balance_m;
    const suiPoolBalance = poolDetails.data.content.fields.balance_s;

    const suiBalanceInPoolConverted = new BigNumber(suiPoolBalance).div(10 ** SUI_DECIMALS);
    const soldMemeAmountConverted = new BigNumber(BondingPoolSingleton.DEFAULT_MAX_M)
      .minus(memePoolBalance)
      .div(10 ** +BondingPoolSingleton.MEMECOIN_DECIMALS);

    // In case no meme coins were sold, return 0-prices
    if (soldMemeAmountConverted.eq(0)) {
      return { priceInSui: "0", priceInUsd: "0" };
    }

    const memePriceInSui = suiBalanceInPoolConverted.div(soldMemeAmountConverted);

    const memePriceInUsd = new BigNumber(memePriceInSui).multipliedBy(suiPrice).toString();

    return { priceInSui: memePriceInSui.toString(), priceInUsd: memePriceInUsd };
  }

  public async getTakeFeesTransactionFromPool({
    transaction,
    owner,
    poolId,
  }: {
    transaction?: TransactionBlock;
    owner: string;
    poolId: string;
  }) {
    const tx = transaction ?? new TransactionBlock();
    const allPoolsWithInfo = await this.getAllPoolsWithDetailedInfo();
    const pool = allPoolsWithInfo.poolsByPoolId[poolId];

    const [memeCoinStakedLp, suiCoin] = takeFees(tx, [LONG_SUI_COIN_TYPE, pool.memeCoinType], {
      pool: pool.objectId,
      policy: pool.detailedPoolInfo.data.content.fields.policy_cap.fields.for,
      admin: BondingPoolSingleton.ADMIN_OBJECT_ID,
    });

    transfer(tx, [LONG_SUI_COIN_TYPE, pool.memeCoinType], {
      pool: pool.objectId,
      policy: pool.detailedPoolInfo.data.content.fields.policy_cap.fields.for,
      recipient: owner,
      token: memeCoinStakedLp,
    });

    tx.transferObjects([suiCoin], owner);

    return tx;
  }

  public async getTakeFeesTransactionFromAllPools({
    transaction,
    owner,
  }: {
    transaction?: TransactionBlock;
    owner: string;
  }) {
    const tx = transaction ?? new TransactionBlock();
    const allPoolsWithInfo = await this.getAllPoolsWithDetailedInfo();

    allPoolsWithInfo.pools.forEach((pool) => {
      if (!pool.detailedPoolInfo) {
        throw new Error("[getTakeFeesTransactionFromAllPools] Detailed pool info is not available");
      }

      const [memeCoinStakedLp, suiCoin] = takeFees(tx, [LONG_SUI_COIN_TYPE, pool.memeCoinType], {
        pool: pool.objectId,
        policy: pool.detailedPoolInfo.data.content.fields.policy_cap.fields.for,
        admin: BondingPoolSingleton.ADMIN_OBJECT_ID,
      });

      transfer(tx, [LONG_SUI_COIN_TYPE, pool.memeCoinType], {
        pool: pool.objectId,
        policy: pool.detailedPoolInfo.data.content.fields.policy_cap.fields.for,
        recipient: owner,
        token: memeCoinStakedLp,
      });

      tx.transferObjects([suiCoin], owner);
    });

    return tx;
  }
}
