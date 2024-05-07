import { provider, suiProviderUrl, user } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/staking-pool/get-all-staked-lp-objects-by-owner.ts
export const getAllPoolsExample = async () => {
  const res = await BondingPoolSingleton.getAllStakedLPObjectsByOwner({ owner: user, provider });
  console.debug("res: ", res);
  console.dir(res, { depth: null });
};

getAllPoolsExample();
