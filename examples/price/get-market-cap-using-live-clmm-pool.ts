import { BondingPoolSingleton, CoinManagerSingleton, LiveCLMM } from "../../src";
import { LONG_SUI_COIN_TYPE } from "../../src/common/sui";
import { provider, suiProviderUrl } from "../common";

// yarn tsx examples/price/get-market-cap-using-live-clmm-pool.ts
(async () => {
  const memeCoinType = "0x4c023b94ba2e42e5ce1400191d0228216359f4de894150b813b1f514d2668426::rinwif::RINWIF";

  const liveInstance = new LiveCLMM({
    provider,
    data: {
      memeCoin: {
        coinType: memeCoinType,
      },
    },
  });

  const suiPrice = await CoinManagerSingleton.getCoinPrice(LONG_SUI_COIN_TYPE);
  const memeCoinPrice = await liveInstance.getMemeCoinPrice2({
    memeCoinType,
    suiPrice,
  });
  const memeCoinMarketCap = BondingPoolSingleton.getMemeMarketCap({
    memeCoinPriceInUSD: memeCoinPrice.priceInUsd,
  });

  console.debug("memeCoinMarketCap: ", memeCoinMarketCap);
})();
