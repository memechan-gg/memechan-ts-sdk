import { suiProviderUrl } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/holders/get-uniq-holders-of-staked-lp-count.ts
export const getUniqHoldersOfStakedLpExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const { poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();
  const pool =
    poolsByMemeCoinTypeMap[
      "0xb09db619ab3cd89355c259660ef4c686b416cd6319332ef41be4dcfd5f4bfe4d::meme_07_05_2024_01::MEME_07_05_2024_01"
    ];

  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

  const res = await bondingCurveInstance.getUniqHoldersOfStakedLpCount({
    bondingCurvePoolObjectId: pool.objectId,
    memeCoin: { coinType: pool.memeCoinType },
  });

  console.debug("res: ", res);
};

getUniqHoldersOfStakedLpExample();
