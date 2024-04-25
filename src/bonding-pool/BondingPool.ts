/* eslint-disable require-jsdoc */
import {
  NewDefaultArgs,
  isReadyToLaunch,
  newDefault,
  swapCoinY,
} from "@avernikoz/memechan-ts-interface/dist/memechan/bound-curve-amm/functions";
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

import { seedPools } from "@avernikoz/memechan-ts-interface/dist/memechan/index/functions";

import { bcs } from "@mysten/sui.js/bcs";
import { SUI_CLOCK_OBJECT_ID, SUI_DECIMALS } from "@mysten/sui.js/utils";
import BigNumber from "bignumber.js";
import { CoinManagerSingleton } from "../coin/CoinManager";
import { CreateCoinTransactionParams } from "../coin/types";
import { LONG_SUI_COIN_TYPE } from "../common/sui";
import { removeDecimalPart } from "../utils/removeDecimalPart";
import {
  CreateBondingCurvePoolParams,
  CreateCoinTransactionParamsWithoutCertainProps,
  SwapSuiForTicketParams,
} from "./types";
import { getAllDynamicFields } from "./utils/getAllDynamicFields";
import { getAllObjects } from "./utils/getAllObjects";
import { getTicketDataFromCoinParams } from "./utils/getTicketDataFromCoinParams";
import { isPoolObjectData } from "./utils/isPoolObjectData";
import { isRegistryTableTypenameDynamicFields } from "./utils/registryTableTypenameUtils";

/**
 * @class BondingPoolSingleton
 * @implements {IBondingPool}
 * @description Singleton class for managing bonding curve pool.
 */
export class BondingPoolSingleton {
  private static _instance: BondingPoolSingleton;
  // TODO: REMOVE THAT BEFORE PROD DEPLOY (TEMP VAR `TX_OF_CONTRACT_DEPLOY`)
  public static TX_OF_CONTRACT_DEPLOY =
    "https://suivision.xyz/txblock/H1jzJ9vPHe2kg3eRYPy6Z6t3CPHe4Mi91H2rrUb9P14z?tab=Changes";

  public static REGISTRY_OBJECT_ID = "0x1627e67622491f0d6fb132148822ab8423ae178a4bb670cfa1270f22457247de";
  public static ADMIN_OBJECT_ID = "0x8f6e687d53b1d0390325da368bd0e7911f9e394a456095199b340596ee8f6ae9";
  public static UPGRADE_CAP_OBJECT_ID = "0xc8fefd616fa07e815340863b091f7ed9477c4010a4d521cf513860c370db57da";
  public static PACKAGE_OBJECT_ID = "0x8f9a0538e30a67e900fe0db14ed6845b72e1f89378f204c2f3ba5b25eadc7fd1";

  // TODO: These prefixes would be changed once we'll re-depoy the contract & re-generate the types
  public static TICKET_COIN_MODULE_PREFIX = "ac_b_";
  public static TICKET_COIN_NAME_PREFIX = "TicketFor";
  public static TICKET_COIN_DESCRIPTION_PREFIX = "Pre sale ticket of bonding curve pool for the following memecoin: ";

  public static MEMECOIN_DECIMALS = "6";
  public static MEMECOIN_MINT_AMOUNT = "0";
  public static MEMECOIN_FIXED_SUPPLY = false;

  public static SIMLATION_ACCOUNT_ADDRESS = "0xe480f679929180f9016e4c7545f1f398640017d05ecccd96b944b7d07c97664c";

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

  // TODO: Add slippage instead of `minOutputTicketAmount` param
  // TODO: Add method for simulating the swap to get the data how much for given
  //  `inputAmount` client can receive `output`.
  public static async swapSuiForTicket(params: SwapSuiForTicketParams) {
    const { memeCoin, ticketCoin, transaction, bondingCurvePoolObjectId, minOutputTicketAmount, inputSuiAmount } =
      params;
    const tx = transaction ?? new TransactionBlock();

    // TODO: We might move these pre-processing to some separate method
    // input
    // Note: Be aware, we relay on the fact that `memecoin` pool is always in pair with SUI coin type, hence why
    // we can specify the decimals right away
    const inputCoinDecimals: number = SUI_DECIMALS;
    const inputAmountWithDecimalsBigNumber = new BigNumber(inputSuiAmount).multipliedBy(10 ** inputCoinDecimals);
    // We do removing the decimal part in case client send number with more decimal part
    // than this particular token has decimal places allowed (`inputCoinDecimals`)
    // That's prevent situation when casting
    // BigNumber to BigInt fails with error ("Cannot convert 183763562.1 to a BigInt")
    const inputAmountWithoutExceededDecimalPart = removeDecimalPart(inputAmountWithDecimalsBigNumber);
    const inputAmountWithDecimals = BigInt(inputAmountWithoutExceededDecimalPart.toString());
    const suiCoinObject = tx.splitCoins(tx.gas, [inputAmountWithDecimals]);

    // output
    // Note: Be aware, we relay on the fact that `MEMECOIN_DECIMALS` would be always set same for all memecoins
    // As well as the fact that memecoins and tickets decimals are always the same
    const outputAmountWithDecimalsBigNumber = new BigNumber(minOutputTicketAmount).multipliedBy(
      10 ** +BondingPoolSingleton.MEMECOIN_DECIMALS,
    );
    // We do removing the decimal part in case client send number with more decimal part
    // than this particular token has decimal places allowed (`outputCoinDecimals`)
    // That's prevent situation when casting
    // BigNumber to BigInt fails with error ("Cannot convert 183763562.1 to a BigInt")
    const outputAmountWithoutExceededDecimalPart = removeDecimalPart(outputAmountWithDecimalsBigNumber);
    const outputAmountWithDecimals = outputAmountWithoutExceededDecimalPart.toString();
    const bigintMinOutput = BigInt(outputAmountWithDecimals);

    const txResult = swapCoinY(tx, [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType], {
      pool: bondingCurvePoolObjectId,
      coinXMinValue: bigintMinOutput,
      coinY: suiCoinObject,
      clock: SUI_CLOCK_OBJECT_ID,
    });

    return { tx, txResult };
  }

  public async getRegistryTableAddress({ transaction }: { transaction?: TransactionBlock } = {}) {
    const tx = transaction ?? new TransactionBlock();
    const txResult = seedPools(tx, BondingPoolSingleton.REGISTRY_OBJECT_ID);
    const res = await this.provider.devInspectTransactionBlock({
      sender: BondingPoolSingleton.SIMLATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });
    if (!res.results) {
      throw new Error("No results found for all bonding curve pools");
    }
    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }

    // console.log("returnValues: ", returnValues);
    const registryTableAddress = returnValues[0][0];
    const decodedTableAddress: string = bcs.de("address", new Uint8Array(registryTableAddress));

    return decodedTableAddress;
  }

  public async getAllPools({ transaction }: { transaction?: TransactionBlock } = {}) {
    const registryTableId = await this.getRegistryTableAddress();

    const tableDynamicFields = await getAllDynamicFields({
      tableId: registryTableId,
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
    // console.debug("tableTypenameObjectIds: ", tableTypenameObjectIds);

    const objectDataList = await getAllObjects({
      objectIds: tableTypenameObjectIds,
      provider: this.provider,
      options: { showContent: true, showDisplay: true },
    });

    // console.debug("objectDataList: ");
    // console.dir(objectDataList, { depth: null });

    if (!isPoolObjectData(objectDataList)) {
      throw new Error("Wrong shape of seed pools of bonding curve pools");
    }

    const poolIds = objectDataList.map((el) => el.data.content.fields.value);

    // TODO: Add pools data (e.g. CoinX, CoinY, Meme) when:
    // 1. Contract would be upgraded
    // 2. More time for it
    return { poolIds };
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
      sender: BondingPoolSingleton.SIMLATION_ACCOUNT_ADDRESS,
      transactionBlock: tx,
    });

    if (!res.results) {
      throw new Error("No results found for all bonding curve pools");
    }
    const returnValues = res.results[0].returnValues;
    if (!returnValues) {
      throw new Error("Return values are undefined");
    }

    // console.log("returnValues: ", returnValues);
    const isReadyToLivePhaseRaw = returnValues[0][0];
    const decodedIsReadyToLivePhase: string = bcs.de("bool", new Uint8Array(isReadyToLivePhaseRaw));

    return decodedIsReadyToLivePhase;
  }
}
