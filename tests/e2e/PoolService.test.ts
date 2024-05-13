import { PoolAPI } from "../../src/coin/PoolApi";
import { livePool, SeedPool, seedPool, stakingPool } from "../../src/coin/schemas/pools-schema";
import { BE_URL } from "./helpers";

const api = new PoolAPI(BE_URL);

describe("PoolService", () => {
  let sp: SeedPool | undefined;

  test("get all seed pools", async () => {
    const pools = await api.getAllSeedPools();
    expect(Array.isArray(pools.result)).toBe(true);
    for (const parsedResult of pools.result) {
      seedPool.parse(parsedResult);
    }
    sp = pools.result[0];
  });

  test("Get a pool for a specific coin", async () => {
    if (sp) {
      const pool = await api.getSeedPoolByCoinType(sp.associatedCoin);
      seedPool.parse(pool);
    }
  });

  test("Ensure that the staking pools is returning the staking pools stored into BE", async () => {
    const poolApi = new PoolAPI(BE_URL);
    const { result: stakingPools } = await poolApi.getStakingPools();
    expect(Array.isArray(stakingPools)).toBe(true);
    for (const parsedResult of stakingPools) {
      stakingPool.parse(parsedResult);
    }
  });

  test("Get a pool for a specific coin", async () => {
    if (sp) {
      const pool = await api.getSeedPoolByCoinType(sp.associatedCoin);
      seedPool.parse(pool);
    }
  });

  test("Ensure that the live pools is returning the live pools stored into BE", async () => {
    const poolApi = new PoolAPI(BE_URL);
    const { result: livePools } = await poolApi.getLivePools();
    expect(Array.isArray(livePools)).toBe(true);
    for (const parsedResult of livePools) {
      if (livePool.safeParse(parsedResult).success) {
        console.warn("Invalid live pool found with format", parsedResult);
      }
    }
  });
});
