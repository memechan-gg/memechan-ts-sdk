import { LiveCLMM } from "../../src";
import { provider } from "../common";

// yarn tsx examples/price/get-meme-price-live-clmm-pool-legacy.ts
export const getMemePrice = async () => {
  const memeCoinType =
    "0xf8a2ba07ec67b0f4ad7458a6d58af6fa7b00374e21d6ae45e3dbe0cab0f78865::meme_06_05_2024_03::MEME_06_05_2024_03";

  const liveInstance = new LiveCLMM({
    provider,
    data: {
      memeCoin: {
        coinType: memeCoinType,
      },
    },
  });

  const { priceInSui, priceInUsd } = await liveInstance.getMemeCoinPrice(memeCoinType);
  console.debug("priceInSui: ", priceInSui);
  console.debug("priceInUsd: ", priceInUsd);
};

getMemePrice();
