import { BondingPoolSingleton, CoinManagerSingleton } from "../../src";
import { LONG_SUI_COIN_TYPE } from "../../src/common/sui";
import { suiProviderUrl } from "../common";

// yarn tsx examples/price/get-market-cap-using-bonding-curve-pool.ts
(async () => {
  const memeCoinType = "0x85fe39ef8d50d686a7a6e12716c3ed34c1c4c753a0c11963adf17fc752af69c9::sc::SC";

  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);
  const suiPrice = await CoinManagerSingleton.getCoinPrice(LONG_SUI_COIN_TYPE);
  const memeCoinPrice = await bondingCurveInstance.getMemeCoinPrice2({
    memeCoinType: memeCoinType,
    suiPrice,
  });

  const memeCoinMarketCap = BondingPoolSingleton.getMemeMarketCap({
    memeCoinPriceInUSD: memeCoinPrice.priceInUsd,
  });

  console.debug("memeCoinMarketCap: ", memeCoinMarketCap);
})();
