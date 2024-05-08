import BigNumber from "bignumber.js";
import { BondingPoolSingleton } from "../../src/bonding-pool/BondingPool";

// yarn tsx examples/bonding-curve/mint-amount.ts
(() => {
  // contract consts
  const DEFAULT_MAX_M_LP = 200_000_000_000_000;
  const DEFAULT_MAX_M = 900_000_000_000_000;

  const MEMECOIN_MINT_AMOUNT_FROM_CONTRACT = new BigNumber(BondingPoolSingleton.DEFAULT_MAX_M_LP)
    .plus(BondingPoolSingleton.DEFAULT_MAX_M)
    .div(10 ** +BondingPoolSingleton.MEMECOIN_DECIMALS)
    .toString();

  console.debug("MEMECOIN_MINT_AMOUNT_FROM_CONTRACT: ", MEMECOIN_MINT_AMOUNT_FROM_CONTRACT);
})();
