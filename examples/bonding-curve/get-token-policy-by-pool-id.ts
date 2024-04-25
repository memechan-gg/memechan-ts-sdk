import { suiProviderUrl } from "../common";
import { BondingPoolSingleton } from "../../src";

// yarn tsx examples/bonding-curve/get-token-policy-by-pool-id.ts
export const getTokenPolicyByPoolIdExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { poolIds } = await bondingCurveInstance.getAllPools();
  const [poolId] = poolIds;

  console.debug("poolId: ", poolId);

  const res = await bondingCurveInstance.getTokenPolicyByPoolId({ poolId });
  console.debug("res: ", res);
};

getTokenPolicyByPoolIdExample();
