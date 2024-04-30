import { PoolAPI } from "../../src/coin/PoolApi";
import { SeedPool, seedPool } from "../../src/coin/schemas/pools-schema";

const BE_URL = "https://14r6b4r6kf.execute-api.us-east-1.amazonaws.com/prod";

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

  test("Get a pool for a specific ticket", async () => {
    if (sp) {
      const pool = await api.getSeedPoolByTicketType(sp.ticketCoinType);
      seedPool.parse(pool);
    }
  });
});
