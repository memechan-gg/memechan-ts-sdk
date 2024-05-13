import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { LivePool } from "../../src/live/LivePool";

describe("Live pool", () => {
  test("Ensure that the parsing from registry staking pools are valid", async () => {
    const livePools = await LivePool.fromRegistry({
      provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
    });
    livePools.forEach((pool) =>
      expect(pool.data).toEqual({
        address: expect.any(String),
        coinType: expect.any(String),
      }),
    );
  });
});
