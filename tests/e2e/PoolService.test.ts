import { PoolAPI } from "../../src/coin/PoolApi";
import { seedPool } from "../../src/coin/schemas/poolsSchema";

const BE_URL = "https://cp1mqp07c3.execute-api.us-east-1.amazonaws.com/prod";

const api = new PoolAPI(BE_URL);

describe("PoolService", () => {
  test("get all seed pools", async () => {
    const pools = await api.getAllSeedPools();
    expect(pools.result.length).toBeGreaterThan(0);
    for (const parsedResult of pools.result) {
      seedPool.parse(parsedResult);
    }
  });

  test("Get a pool for a specific coin", async () => {
    const pool = await api.getSeedPoolByCoinType(
      "0x997285eeef9681204c0bfc14c66b52c5548cb2967c022b41e5fa8284d366edda::test_token_4am::TEST_TOKEN_4AM",
    );
    seedPool.parse(pool);
  });

  test("Get a pool for a specific ticket", async () => {
    const pool = await api.getSeedPoolByTicketType(
      "0xfa9f8b5e000aba4f753dd3eeb30797e9b3e5f94f062aba6a63b1ba8e2bb5f6f1::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
    );
    seedPool.parse(pool);
  });
});
