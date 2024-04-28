import { suiProviderUrl, user } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/staking-pool/get-available-staked-lp-objects-by-owner.ts
export const getAvailableStakedLpsByOwner = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const res = await bondingCurveInstance.getAvailableStakedLpByOwner({ owner: user });
  console.debug("res: ", res);
  console.dir(res, { depth: null });
};

getAvailableStakedLpsByOwner();
