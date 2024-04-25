import { suiProviderUrl } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/bonding-curve/get-all-pools.ts
export const getAllPoolsExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const res = await bondingCurveInstance.getAllPools();
  console.debug("res: ", res);
};

getAllPoolsExample();
