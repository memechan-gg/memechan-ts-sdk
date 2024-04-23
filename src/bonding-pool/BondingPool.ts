/* eslint-disable require-jsdoc */
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { newDefault, NewDefaultArgs } from "@avernikoz/memechan-ts-interface/dist/memechan/bound-curve-amm/functions";

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

  public static TICKET_COIN_MODULE_PREFIX = "ac_b_";
  public static TICKET_COIN_NAME_PREFIX = "TicketFor";
  public static TICKET_COIN_DESCRIPTION_PREFIX = "Pre sale ticket of bonding curve pool for the following memecoin: ";

  public provider: SuiClient;

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
}
