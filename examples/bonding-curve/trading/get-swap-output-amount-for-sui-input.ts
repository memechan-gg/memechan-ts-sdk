import { suiProviderUrl } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/get-swap-output-amount-for-sui-input.ts
export const getSwapOutputAmountByPoolExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);
  const { pools } = await bondingCurveInstance.getAllPools();
  const pool = pools[1];

  console.debug("pool: ", pool);

  const inputAmount = "950";
  //   const inputAmount = "30000";

  const res = await bondingCurveInstance.getSwapOutputAmountForSuiInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputAmount,
    memeCoin: { coinType: pool.memeCoinType },
    ticketCoin: { coinType: pool.ticketCoinType },
    // slippagePercentage: 1,
  });
  console.debug("res: ", res);
};

getSwapOutputAmountByPoolExample();