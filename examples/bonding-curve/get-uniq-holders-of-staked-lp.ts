import { suiProviderUrl } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/bonding-curve/get-uniq-holders-of-staked-lp.ts
export const getUniqHoldersOfStakedLpExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { pools } = await bondingCurveInstance.getAllPools();
  const [pool] = pools;

  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

  const res = await bondingCurveInstance.getUniqHoldersOfStakedLp({
    bondingCurvePoolObjectId: pool.objectId,
    memeCoin: { coinType: pool.memeCoinType },
  });

  console.debug("res: ", res);
};

getUniqHoldersOfStakedLpExample();
