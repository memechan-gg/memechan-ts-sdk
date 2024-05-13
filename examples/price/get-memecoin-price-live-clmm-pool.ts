import { BondingPoolSingleton, CoinManagerSingleton, LiveCLMM } from "../../src";
import { LONG_SUI_COIN_TYPE } from "../../src/common/sui";
import { provider, suiProviderUrl } from "../common";

// yarn tsx examples/price/get-memecoin-price-live-clmm-pool.ts
(async () => {
  const suiPrice = await CoinManagerSingleton.getCoinPrice(LONG_SUI_COIN_TYPE);
  const memeCoinType = "0x4c023b94ba2e42e5ce1400191d0228216359f4de894150b813b1f514d2668426::rinwif::RINWIF";

  const liveInstance = new LiveCLMM({
    provider,
    data: {
      memeCoin: {
        coinType: memeCoinType,
      },
    },
  });

  const memeCoinPrice = liveInstance.getMemeCoinPrice2({
    memeCoinType,
    suiPrice,
  });

  console.debug("memeCoinPrice: ", memeCoinPrice);
})();
