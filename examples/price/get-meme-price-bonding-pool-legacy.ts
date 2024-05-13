import { suiProviderUrl } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/price/get-meme-price-legacy.ts
export const getMemePrice = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { priceInSui, priceInUsd } = await bondingCurveInstance.getMemeCoinPrice(
    "0x85fe39ef8d50d686a7a6e12716c3ed34c1c4c753a0c11963adf17fc752af69c9::sc::SC",
  );

  const mcapOld = (Number(BondingPoolSingleton.MEMECOIN_MINT_AMOUNT_FROM_CONTRACT) * Number(priceInUsd)).toFixed(2);

  console.log("mcapOld: ", mcapOld);

  console.debug("priceInSui: ", priceInSui);
  console.debug("priceInUsd: ", priceInUsd);
};

getMemePrice();
