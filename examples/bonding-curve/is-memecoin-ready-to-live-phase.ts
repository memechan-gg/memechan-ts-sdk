import { BondingPoolSingleton } from "../../src";
import { suiProviderUrl } from "../common";

// yarn tsx examples/bonding-curve/is-memecoin-ready-to-live-phase.ts
export const isMemecoinReadyToLivePhase = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  const memecoinCointype =
    "0x232bcf980b826ab7bba1629c807b756e7fc507d0e84f009bfdd31caffa175365::meme_08_05_2024_06::MEME_08_05_2024_06";

  const pool = poolsByMemeCoinTypeMap[memecoinCointype];

  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

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
