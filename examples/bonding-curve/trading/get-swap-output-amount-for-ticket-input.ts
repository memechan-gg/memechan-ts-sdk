import { suiProviderUrl } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/get-swap-output-amount-for-ticket-input.ts
export const getSwapOutputAmountByPoolExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);
  const { pools } = await bondingCurveInstance.getAllPools();
  const pool = pools[1];

  console.debug("pool: ", pool);

  const inputAmount = "1000000";

  const res = await bondingCurveInstance.getSwapOutputAmountForTicketInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount: inputAmount,
    memeCoin: { coinType: pool.memeCoinType },
    ticketCoin: { coinType: pool.ticketCoinType },
    // slippagePercentage: 1,
  });
  console.debug("res: ", res);
};

getSwapOutputAmountByPoolExample();
