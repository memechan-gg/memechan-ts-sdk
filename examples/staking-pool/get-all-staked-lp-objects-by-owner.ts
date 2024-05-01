import { suiProviderUrl, user } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/staking-pool/get-all-staked-lp-objects-by-owner.ts
export const getAllPoolsExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const res = await bondingCurveInstance.getAllStakedLPObjectsByOwner({ owner: user });
  console.debug("res: ", res);
  console.dir(res, { depth: null });
};

getAllPoolsExample();
