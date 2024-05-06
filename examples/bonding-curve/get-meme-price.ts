import { suiProviderUrl } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/bonding-curve/get-meme-price.ts
export const getMemePrice = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { priceInSui, priceInUsd } = await bondingCurveInstance.getMemeCoinPrice(
    "0xb461467394a57e2608e84889c8b0143d3e5a80a94d03d086ad0303ff8505eb4c::meme_06_05_2024_04::MEME_06_05_2024_04",
  );
  console.debug("priceInSui: ", priceInSui);
  console.debug("priceInUsd: ", priceInUsd);
};

getMemePrice();
