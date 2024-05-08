import { CoinMetadata, SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui.js/utils";
import { PRICE_API_CHAIN_ID, PRICE_API_URL } from "../constants";
import { CommonCoinData, CreateCoinTransactionParams, ICoinManager } from "./types";
import initMoveByteCodeTemplate from "./utils/move-bytecode-template";
import { getBytecode } from "./utils/template";
import { isValidPriceApiResponse } from "./utils/type-guards";
import {
  InvalidCoinDecimalsError,
  InvalidCoinDescriptionError,
  InvalidCoinImageError,
  InvalidCoinNameError,
  InvalidCoinSymbolError,
  InvalidCoinTotalSupplyError,
  InvalidSignerAddressError,
  NameEqualsToDescriptionError,
  SymbolEqualsToDescriptionError,
} from "./utils/validation/invalid-param-errors";
import {
  validateCoinDecimals,
  validateCoinDescription,
  validateCoinImage,
  validateCoinName,
  validateCoinSymbol,
  validateTotalSupply,
} from "./utils/validation/validation";

/**
 * @class CoinManagerSingleton
 * @implements {ICoinManager}
 * @description Singleton class for managing coins.
 */
export class CoinManagerSingleton implements ICoinManager {
  private static _instance: CoinManagerSingleton;
  private allCoinsCache: Map<string, CommonCoinData> = new Map();
  private provider: SuiClient;
  private static COIN_CREATION_BYTECODE_TEMPLATE_URL = "https://www.suicoins.com/move_bytecode_template_bg.wasm";

  /**
   * Constructs a new instance of the SuiProvider class with the provided SUI provider URL.
   *
   * @private
   * @constructor
   * @param {string} suiProviderUrl - The URL of the SUI provider.
   */
  private constructor(suiProviderUrl: string) {
    this.provider = new SuiClient({ url: suiProviderUrl });
  }

  /**
   * @public
   * @method getInstance
   * @description Gets the singleton instance of CoinManagerSingleton.
   * @param {string} [suiProviderUrl] - Url of SUI provider.
   * @return {CoinManagerSingleton} The singleton instance of CoinManagerSingleton.
   */
  public static getInstance(suiProviderUrl?: string): CoinManagerSingleton {
    if (!CoinManagerSingleton._instance) {
      if (suiProviderUrl === undefined) {
        throw new Error("[Coin] SUI provider url is required in arguments to create CoinManager instance.");
      }

      const instance = new CoinManagerSingleton(suiProviderUrl);
      CoinManagerSingleton._instance = instance;
    }

    return CoinManagerSingleton._instance;
  }

  /**
   * @public
   * @method getCoinByType2
   * @description Retrieves coin data by its type from the cache or asynchronously.
   * @param {string} coinType - The type of the coin to retrieve.
   * @return {Promise<CommonCoinData | null>} The coin data if found or fetched, otherwise null.
   */
  public async getCoinByType2(coinType: string): Promise<CommonCoinData | null> {
    const coinData = this.allCoinsCache.get(coinType);

    if (coinData === undefined) {
      console.warn(`[getCoinByType2] No decimals for coin ${coinType}, so fetching...`);
      const fetchedCoinMetadata: CoinMetadata | null = await this.fetchCoinMetadata(coinType);

      if (fetchedCoinMetadata) {
        const coinDataFetched = { ...fetchedCoinMetadata, type: coinType };
        this.allCoinsCache.set(coinType, coinDataFetched);

        return coinDataFetched;
      }

      return null;
    }

    return coinData;
  }

  /**
   * Fetches metadata for a specific coin asynchronously.
   *
   * @public
   * @param {string} coinType - The type of the coin for which to fetch metadata.
   * @return {Promise<CoinMetadata | null>} A promise that resolves to the metadata of the specified coin,
   * or null if no metadata is available.
   */
  public async fetchCoinMetadata(coinType: string): Promise<CoinMetadata | null> {
    try {
      const coinMetadata = await this.provider.getCoinMetadata({ coinType });

      return coinMetadata;
    } catch (e) {
      console.warn(
        `[CoinManager.fetchCoinMetadata] error occured while fetching metadata for ${coinType} from RPC: `,
        e,
      );

      return null;
    }
  }

  /**
   * Gets a transaction for creating a coin on SUI blockchain.
   *
   * @param {CreateCoinTransactionParams} params - Parameters for creating the coin.
   * @param {string} params.name - The name of the coin.
   * @param {string} params.symbol - The symbol of the coin.
   * @param {string} params.decimals - The number of decimals for the coin.
   * @param {boolean} params.fixedSupply - Indicates if the coin has a fixed supply.
   * @param {string} params.mintAmount - The initial mint amount for the coin.
   * @param {string} params.url - The URL associated with the coin.
   * @param {string} params.description - The description of the coin.
   * @param {string} params.signerAddress - The address of the signer.
   * @param {TransactionBlock} [params.transaction] - The optional transaction block.
   * @return {Promise<TransactionBlock>} - A promise resolving to the created transaction block.
   * @throws {Error} If the request to create the coin fails.
   */
  public static async getCreateCoinTransaction({
    name,
    symbol,
    decimals,
    fixedSupply,
    mintAmount,
    url,
    description,
    signerAddress,
    transaction,
  }: CreateCoinTransactionParams): Promise<TransactionBlock> {
    const tx = transaction ?? new TransactionBlock();

    try {
      await initMoveByteCodeTemplate(CoinManagerSingleton.COIN_CREATION_BYTECODE_TEMPLATE_URL);

      const [upgradeCap] = tx.publish({
        modules: [
          [
            ...getBytecode({
              name,
              symbol,
              totalSupply: mintAmount,
              description,
              fixedSupply,
              decimals: +decimals,
              imageUrl: url,
              recipient: signerAddress,
            }),
          ],
        ],
        dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
      });

      // TODO: We might destroy the upgradeCap
      tx.transferObjects([upgradeCap], tx.pure(signerAddress));

      return tx;
    } catch (error) {
      console.error("[CoinManager.getCreateCoinTransaction] error: ", error);
      throw error;
    }
  }

  /**
   * Validates parameters for creating the coin.
   *
   * @param {CreateCoinTransactionParams} params - Parameters for creating the coin.
   * @throws {Error} If the validation fails.
   */
  public static validateCreateCoinParams({
    name,
    symbol,
    decimals,
    mintAmount,
    url,
    description,
    signerAddress,
  }: CreateCoinTransactionParams): void {
    if (!validateCoinName(name)) {
      throw new InvalidCoinNameError(`[validateCreateCoinParams] Coin name ${name} is invalid`);
    }

    if (!validateCoinSymbol(symbol)) {
      throw new InvalidCoinSymbolError(`[validateCreateCoinParams] Coin symbol ${symbol} is invalid`);
    }

    if (!validateCoinDecimals(decimals)) {
      throw new InvalidCoinDecimalsError(`[validateCreateCoinParams] Coin decimals ${decimals} are invalid`);
    }

    if (!validateTotalSupply(mintAmount, decimals)) {
      throw new InvalidCoinTotalSupplyError(`[validateCreateCoinParams] Total supply ${mintAmount} is invalid`);
    }

    if (!validateCoinDescription(description)) {
      throw new InvalidCoinDescriptionError(`[validateCreateCoinParams] Coin description ${description} is invalid`);
    }

    if (!validateCoinImage(url)) {
      throw new InvalidCoinImageError(`[validateCreateCoinParams] Coin image ${url} is invalid`);
    }

    if (!isValidSuiAddress(signerAddress)) {
      throw new InvalidSignerAddressError(`[validateCreateCoinParams] Signer address ${signerAddress} is invalid`);
    }

    if (name.trim() === description.trim()) {
      throw new NameEqualsToDescriptionError(
        `[validateCreateCoinParams] Coin name ${name} and coin description ${description} are equal`,
      );
    }

    if (symbol.trim() === description.trim()) {
      throw new SymbolEqualsToDescriptionError(
        `[validateCreateCoinParams] Coin symbol ${symbol} and coin description ${description} are equal`,
      );
    }
  }

  /**
   * Fetches a price for a given coin type.
   * @param {string} coinType — A type of the coin the price will be fetched for.
   * @return {Promise<number>} — The given coin price.
   */
  public static async getCoinPrice(coinType: string): Promise<number> {
    const priceResponse = await fetch(
      `${PRICE_API_URL}/api/assets?chainId=${PRICE_API_CHAIN_ID}&tokenAddress=${coinType}`,
    );

    const priceData = await priceResponse.json();

    if (!isValidPriceApiResponse(priceData)) {
      throw new Error(`[CoinManager.getCoinPrice] price data is not valid: ${JSON.stringify(priceData, null, 2)}`);
    }

    const price = priceData.data.price;

    return price;
  }
}
