import { CoinMetadata, SuiClient } from "@mysten/sui.js/client";
import { CommonCoinData, CreateCoinTransactionParams, ICoinManager } from "./types";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getBytecode } from "./utils/template";
import { normalizeSuiAddress } from "@mysten/sui.js/utils";
import initMoveByteCodeTemplate from "./utils/move-bytecode-template";

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

      tx.transferObjects([upgradeCap], tx.pure(signerAddress));

      return tx;
    } catch (error) {
      console.error("[CoinManager.getCreateCoinTransaction] error: ", error);
      throw error;
    }
  }
}
