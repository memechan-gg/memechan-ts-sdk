import { BondingPoolSingleton } from "../../src";
import { suiProviderUrl } from "../common";

// yarn tsx examples/bonding-curve/is-memecoin-ready-to-live-phase.ts
export const isMemecoinReadyToLivePhase = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();
  // get random pool
  const pool =
    poolsByMemeCoinTypeMap[
      "0xd7436c4c051caf789cc80901a22a97bb59c44fbd0f7f55e2470ac3dec375e8b0::meme_06_05_2024_02::MEME_06_05_2024_02"
    ];

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
