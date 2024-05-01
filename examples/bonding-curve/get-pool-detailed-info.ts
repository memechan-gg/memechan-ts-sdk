import { suiProviderUrl } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/bonding-curve/get-pool-detailed-info.ts
export const getPoolDetailedInfo = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);
  const allPools = await bondingCurveInstance.getAllPools();
  const pool = allPools.pools[0];

  const res = await bondingCurveInstance.getPoolDetailedInfo({ poolId: pool.objectId });
  console.debug("res: ", res);
};

getPoolDetailedInfo();
