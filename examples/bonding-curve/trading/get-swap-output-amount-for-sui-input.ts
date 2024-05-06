import { suiProviderUrl } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/get-swap-output-amount-for-sui-input.ts
export const getSwapOutputAmountByPoolExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();
  const pool =
    poolsByMemeCoinTypeMap[
      "0xbbd380a1ac2e03b7b56f429c1abd660a2db16ef019fc6366c1b43dc6b5450979::meme_04_05_2024_01::MEME_04_05_2024_01"
    ];
  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

  console.debug("pool: ", pool);

  const inputAmount = "1";
  //   const inputAmount = "30000";

  const res = await bondingCurveInstance.getSwapOutputAmountForSuiInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputAmount,
    memeCoin: { coinType: pool.memeCoinType },
    // slippagePercentage: 1,
  });
  console.debug("res: ", res);
};

getSwapOutputAmountByPoolExample();
