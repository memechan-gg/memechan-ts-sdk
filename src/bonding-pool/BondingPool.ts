/* eslint-disable require-jsdoc */
import {
  NewArgs,
  NewDefaultArgs,
  buyMeme,
  isReadyToLaunch,
  newDefault,
  new_,
  quoteBuyMeme,
  quoteSellMeme,
  sellMeme,
} from "@avernikoz/memechan-ts-interface/dist/memechan/seed-pool/functions";

import { split, join, intoToken } from "@avernikoz/memechan-ts-interface/dist/memechan/staked-lp/functions";
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionArgument, TransactionBlock } from "@mysten/sui.js/transactions";

import { seedPools } from "@avernikoz/memechan-ts-interface/dist/memechan/index/functions";
import { StakedLP } from "@avernikoz/memechan-ts-interface/dist/memechan/staked-lp/structs";

import { goLiveDefault } from "@avernikoz/memechan-ts-interface/dist/memechan/go-live/functions";
import { bcs } from "@mysten/sui.js/bcs";
import { SUI_CLOCK_OBJECT_ID, SUI_DECIMALS } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { CoinManagerSingleton } from "../coin/CoinManager";
import { CreateCoinTransactionParams } from "../coin/types";
import { LONG_SUI_COIN_TYPE } from "../common/sui";
import {
  BondingCurveCustomParams,
  CreateBondingCurvePoolParams,
  CreateCoinTransactionParamsWithoutCertainProps,
  DetailedPoolInfo,
  ExtractedRegistryKeyData,
  GetBondingCurveCustomParams,
  StakedLpObject,
  SwapParamsForSuiInput,
  SwapParamsForSuiInputAndTicketOutput,
  SwapParamsForTicketInput,
  SwapParamsForTicketInputAndSuiOutput,
} from "./types";
import { deductSlippage } from "./utils/deductSlippage";
import { extractCoinType } from "./utils/extractCoinType";
import { extractRegistryKeyData } from "./utils/extractRegistryKeyData";
import { getAllDynamicFields } from "./utils/getAllDynamicFields";
import { getAllObjects } from "./utils/getAllObjects";
import { getAllOwnedObjects } from "./utils/getAllOwnedObjects";
import { getTicketDataFromCoinParams } from "./utils/getTicketDataFromCoinParams";
import { isPoolObjectData } from "./utils/isPoolObjectData";
import { isStakedLpObjectDataList } from "./utils/isStakedLpObjectData";
import { isTokenPolicyCapObjectData } from "./utils/isTokenPolicyCapObjectData";
import { normalizeInputCoinAmount } from "./utils/normalizeInputCoinAmount";
import { isRegistryTableTypenameDynamicFields } from "./utils/registryTableTypenameUtils";
import { isPoolDetailedInfo } from "./utils/isPoolDetailedInfo";

/**
 * @class BondingPoolSingleton
 * @implements {IBondingPool}
 * @description Singleton class for managing bonding curve pool.
 */
export class BondingPoolSingleton {
  private static _instance: BondingPoolSingleton;
  public static TX_OF_CONTRACT_DEPLOY =
    "https://suivision.xyz/txblock/4exX4n9sNeTWwCcb9yFzd415E1Zf21CfKRr2eqQRrNgv?tab=Changes";

  public static SUI_METADATA_OBJECT_ID = "0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3";

  public static PACKAGE_OBJECT_ID = "0xa06a92a380b04366b5bf54587b89c0d04772e48170ea3c3d0647dac85be038d9";
  public static UPGRADE_CAP_OBJECT_ID = "0xf5c67bd71a1d71e14505860407a8ce9e4bbbe5b879c05c16693c301aae9595c3";
  public static REGISTRY_OBJECT_ID = "0x71cf42c722f75314c7e9649c89b1a11e9e557242b713a0b619bdda13dfb5ac6b";
  public static ADMIN_OBJECT_ID = "0x6bb56f9b2d15eb26f1ada8b40136bbef755dc735cbb5b994b566e96db2ec3596";
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

  public static TICKET_COIN_DECIMALS = BondingPoolSingleton.MEMECOIN_DECIMALS;

  // TODO: Change these values
  public static LP_COIN_MODULE_PREFIX = "lp_coin";
  public static LP_COIN_NAME_PREFIX = "LpCoin";
  public static LP_COIN_DESCRIPTION_PREFIX = "Lp coin for CLMM pool";
  // TODO: Re-visit this
  public static LP_COIN_DECIMALS = BondingPoolSingleton.MEMECOIN_DECIMALS;

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

  public async getAllStakedLPObjectsByOwner({ owner }: { owner: string }) {
    const stakedLpObjects = await getAllOwnedObjects({
      provider: this.provider,
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
        .dividedBy(10 ** +BondingPoolSingleton.LP_COIN_DECIMALS)
        .toString(),
      untilTimestamp: +el.data.content.fields.until_timestamp,
      ticketCoinType: extractCoinType(el.data.type),
    }));

    const stakedLpObjectsByTicketCoinTypeMap = stakedLpObjectList.reduce(
      (acc: { [ticketCoinType: string]: StakedLpObject[] }, el) => {
        if (acc[el.ticketCoinType]) {
          acc[el.ticketCoinType] = [...acc[el.ticketCoinType], el];
        } else {
          acc[el.ticketCoinType] = [el];
        }

        return acc;
      },
      {},
    );

    return { stakedLpObjectList, stakedLpObjectsByTicketCoinTypeMap };
  }

  public async getAvailableStakedLpByOwner({ owner }: { owner: string }) {
    const allStakedLpsByOwner = await this.getAllStakedLPObjectsByOwner({ owner });
    const currentTimestampMs = Date.now();
    const availableStakedLps = allStakedLpsByOwner.stakedLpObjectList.filter(
      (el) => currentTimestampMs > el.untilTimestamp,
    );

    const availableStakedLpObjectsByTicketCoinTypeMap = availableStakedLps.reduce(
      (acc: { [ticketCoinType: string]: StakedLpObject[] }, el) => {
        if (acc[el.ticketCoinType]) {
          acc[el.ticketCoinType] = [...acc[el.ticketCoinType], el];
        } else {
          acc[el.ticketCoinType] = [el];
        }

        return acc;
      },
      {},
    );

    return { availableStakedLps, availableStakedLpObjectsByTicketCoinTypeMap };
  }

  public async getAvailableAmountOfTicketsToSell({
    owner,
    ticketCoin,
  }: {
    owner: string;
    ticketCoin: { coinType: string };
  }) {
    const { availableStakedLpObjectsByTicketCoinTypeMap } = await this.getAvailableStakedLpByOwner({
      owner,
    });
    const availableTickets = availableStakedLpObjectsByTicketCoinTypeMap[ticketCoin.coinType] ?? [];

    const aggregatedAmount = availableTickets.reduce(
      (acc: BigNumber, el) => acc.plus(new BigNumber(el.balance)),
      new BigNumber(0),
    );

    return {
      amount: aggregatedAmount.toString(),
      amountWithDecimals: aggregatedAmount.div(10 ** +BondingPoolSingleton.LP_COIN_DECIMALS),
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

  /**
   *
   * This method generates a merged ticket object for a swap transaction.
   * It combines available tickets to fulfill the remaining amount.
   * Note: It relies on the assumption that the client always provides available tickets
   * with a total balance greater than the remaining amount to be swapped.
   * In other words, `remainingAmountBN` should always be less than sum of all availableTickets `balance`.
   *
   * @param {Object} options - The options object.
   * @param {BigNumber} options.remainingAmountBN - The remaining amount to be swapped.
   * @param {StakedLpObject[]} options.availableTickets - An array of available staked LP objects.
   * @param {string} options.tokenPolicyObjectId - The ID of the token policy object.
   * @param {string} options.ticketCoinType - The coin type of the ticket.
   * @param {TransactionBlock} [options.transaction] - Optional transaction block object.
   * @return {TransactionObject} - The merged ticket object for the swap.
   */
  private async getMergedTicketObjectForSwap({
    remainingAmountBN,
    availableTickets,
    tokenPolicyObjectId,
    ticketCoinType,
    transaction,
  }: {
    remainingAmountBN: BigNumber;
    availableTickets: StakedLpObject[];
    tokenPolicyObjectId: string;
    ticketCoinType: string;
    transaction?: TransactionBlock;
  }) {
    const tx = transaction ?? new TransactionBlock();
    const firstTicket = availableTickets[0];
    let ticketObject: TransactionArgument = tx.object(firstTicket.objectId);

    const firstTicketAmountBN = new BigNumber(firstTicket.balance);

    // if first ticket object can fulfill all remaining amount at once without split
    if (firstTicketAmountBN.isEqualTo(remainingAmountBN)) {
      remainingAmountBN = remainingAmountBN.minus(firstTicketAmountBN);
    } else if (firstTicketAmountBN.isGreaterThan(remainingAmountBN)) {
      // if first ticket object can fulfill all remaining amount with split
      const splitAmountBigInt = BigInt(remainingAmountBN.toString());
      const splitTxResult = split(tx, firstTicket.ticketCoinType, {
        self: firstTicket.objectId,
        splitAmount: splitAmountBigInt,
      });
      const [ticketSplittedObject] = splitTxResult;
      ticketObject = ticketSplittedObject;
      remainingAmountBN = remainingAmountBN.minus(remainingAmountBN);
    } else if (firstTicketAmountBN.isLessThan(remainingAmountBN)) {
      // if first ticket object can't fulfull remaining amount, we just skip it, since we set it initially
      // in the ticketObject above
      remainingAmountBN = remainingAmountBN.minus(firstTicketAmountBN);

      availableTickets = availableTickets.slice(1);
    }

    for (const ticket of availableTickets) {
      // check if the first ticket fulfulled already the remaining amount
      if (remainingAmountBN.isEqualTo(0)) {
        // console.warn("Remaining amount is 0, skipping");
        break;
      }

      const ticketBalanceBN = new BigNumber(ticket.balance);

      if (ticketBalanceBN.isEqualTo(remainingAmountBN)) {
        // if current ticket is equal to remainingAmount
        join(tx, ticket.ticketCoinType, { self: ticketObject, c: ticket.objectId });

        break;
      } else if (ticketBalanceBN.isGreaterThan(remainingAmountBN)) {
        // if current ticket amount is bigger than the remainingAmount, we need to split, and then exit from the loop
        const splitAmountBigInt = BigInt(remainingAmountBN.toString());
        const splitTxResult = split(tx, ticket.ticketCoinType, {
          self: ticket.objectId,
          splitAmount: splitAmountBigInt,
        });
        const [ticketSplittedObject] = splitTxResult;
        join(tx, ticket.ticketCoinType, { self: ticketObject, c: ticketSplittedObject });

        break;
      } else if (ticketBalanceBN.isLessThan(remainingAmountBN)) {
        // if current ticket amount is less than the remainingAmount, we need to join with existing tickets
        // and continue iterating over cycle
        join(tx, ticket.ticketCoinType, { self: ticketObject, c: ticket.objectId });
      }

      remainingAmountBN = remainingAmountBN.minus(ticketBalanceBN);
    }

    // converting ticket into token object
    const ticketTokenObjectTxResult = intoToken(tx, ticketCoinType, {
      clock: SUI_CLOCK_OBJECT_ID,
      policy: tokenPolicyObjectId,
      stakedLp: ticketObject,
    });
    const [ticketTokenObject] = ticketTokenObjectTxResult;

    return ticketTokenObject;
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

    // TODO ASAP IMPORTANT: Replace `ticketCoin` in the params with something else (maybe `memeCoin` would work)
    const { amountWithDecimals, tickets: availableTickets } = await this.getAvailableAmountOfTicketsToSell({
      owner,
      // TODO ASAP IMPORTANT: Replace `ticketCoin` in the params with something else (maybe `memeCoin` would work)
      ticketCoin: { coinType: "" },
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

    // TODO ASAP IMPORTANT: Replace `ticketCoin` in the params with something else (maybe `memeCoin` would work)
    const ticketObject = await this.getMergedTicketObjectForSwap({
      remainingAmountBN,
      availableTickets,
      tokenPolicyObjectId,
      // TODO ASAP IMPORTANT: Replace `ticketCoin` in the params with something else (maybe `memeCoin` would work)
      ticketCoinType: "",
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
      coinM: ticketObject,
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
    // TODO: Might be good to get detailed info for all pools data here as well

    const pools = objectDataList.map((el) => ({
      objectId: el.data.content.fields.value,
      typename: el.data.content.fields.name.fields.name,
      ...extractRegistryKeyData(el.data.content.fields.name.fields.name),
    }));

    const poolIds = pools.map((el) => el.objectId);

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
      decimals: BondingPoolSingleton.LP_COIN_DECIMALS,
      description: BondingPoolSingleton.LP_COIN_DESCRIPTION_PREFIX,
      fixedSupply: false,
      mintAmount: "900000000",
      name: BondingPoolSingleton.LP_COIN_NAME_PREFIX,
      signerAddress: signer,
      symbol: BondingPoolSingleton.LP_COIN_MODULE_PREFIX,
      // TODO: Add LP COIN URL
      url: "",
    };
  }

  public static initSecondaryMarket(params: {
    transaction?: TransactionBlock;
    adminCap: string;
    seedPool: string;
    memeMeta: string;
    memeCoinType: string;
    lpCoinType: string;
    lpCoinTreasureCapId: string;
    lpMeta: string;
    suiMetadataObject: string;
    coinTicketType: string;
  }) {
    const tx = params.transaction ?? new TransactionBlock();

    const txResult = goLiveDefault(tx, [params.memeCoinType, params.lpCoinType], {
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

  public async getInitSecondaryMarketData(params: { poolId: string }) {
    const { poolId } = params;
    const { poolsByPoolId } = await this.getAllPools();
    const pool = poolsByPoolId[poolId];

    const instance = CoinManagerSingleton.getInstance(this.suiProviderUrl);
    const memeMetaDataPromise = instance.fetchCoinMetadata(pool.memeCoinType);
    const ticketMetaDataPromise = instance.fetchCoinMetadata(pool.ticketCoinType);

    const [memeMetaData, ticketMetaData] = await Promise.all([memeMetaDataPromise, ticketMetaDataPromise]);

    if (!memeMetaData) {
      throw new Error("Meme metadata is null");
    }

    if (!ticketMetaData) {
      throw new Error("Ticket metadata is null");
    }

    const memeMetaDataObjectId = memeMetaData.id;
    const ticketMetaDataObjectId = ticketMetaData.id;

    if (!memeMetaDataObjectId) {
      throw new Error("Meme id is empty");
    }

    if (!ticketMetaDataObjectId) {
      throw new Error("Ticket id is empty");
    }

    return {
      adminCap: BondingPoolSingleton.ADMIN_OBJECT_ID,
      seedPool: pool.objectId,
      memeMeta: memeMetaDataObjectId,
      memeCoinType: pool.memeCoinType,
      suiMetadataObject: BondingPoolSingleton.SUI_METADATA_OBJECT_ID,
      coinTicketType: pool.ticketCoinType,
    };
  }
}
