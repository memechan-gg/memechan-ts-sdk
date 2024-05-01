import { BondingPoolSingleton } from "../../src";
import { suiProviderUrl } from "../common";

// yarn tsx examples/bonding-curve/is-memecoin-ready-to-live-phase.ts
export const isMemecoinReadyToLivePhase = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { pools } = await bondingCurveInstance.getAllPools();
  const [pool] = pools;

  console.debug("allPools: ", pools);
  console.debug("poolId: ", pool.objectId);
  console.debug("pool: ", pool);

  const res = await bondingCurveInstance.isMemeCoinReadyToLivePhase({
    memeCoin: { coinType: pool.memeCoinType },
    poolId: pool.objectId,
  });
  console.debug("res: ", res);
};

isMemecoinReadyToLivePhase();
