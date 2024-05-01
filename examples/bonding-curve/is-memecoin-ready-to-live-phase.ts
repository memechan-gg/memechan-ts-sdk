import { BondingPoolSingleton } from "../../src";
import { suiProviderUrl } from "../common";

// yarn tsx examples/bonding-curve/is-memecoin-ready-to-live-phase.ts
export const isMemecoinReadyToLivePhase = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();
  // get random pool
  const pool =
    poolsByMemeCoinTypeMap[
      "0xdb838a0becb92dcf9fd66127136f517f8f6d7a9f973b2344d1ebbd7d2cf2c0fa::meme_02_05_2024::MEME_02_05_2024"
    ];

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
