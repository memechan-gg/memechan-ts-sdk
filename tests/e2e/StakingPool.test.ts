import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { StakingPool } from "../../src";
import { FeeState } from "../../src/staking-pool/FeeState";
import { VestingConfig } from "../../src/staking-pool/VestingConfig";

describe("Staking Pool", () => {
  /* test("Ensuring that the staking pool is instanciated properly starting from TX digest", async () => {
    const stakingPool = await StakingPool.fromGoLiveDefaultTx({
      txDigest: "Au9BYYmaaVqrC9uAXBX2zvzDdNwHt8xBcHy9oNM2qJ3a",
      provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
    });
    expect(stakingPool.data).toEqual({
      feeState: expect.any(FeeState),
      vesting: expect.any(VestingConfig),
      address: expect.any(String),
      ammPool: expect.any(String),
      poolAdmin: expect.any(String),
      totalSupply: expect.any(String),
      lpCoinType: expect.any(String),
      memeCoinType: expect.any(String),
      balanceLp: expect.any(String),
    });
  });*/

  test("Ensure that the parsing from registry staking pools are valid", async () => {
    const stakingPools = await StakingPool.fromRegistry({
      provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
    });

    stakingPools.forEach((pool) =>
      expect(pool.data).toEqual({
        feeState: expect.any(FeeState),
        vesting: expect.any(VestingConfig),
        address: expect.any(String),
        ammPool: expect.any(String),
        poolAdmin: expect.any(String),
        totalSupply: expect.any(String),
        lpCoinType: expect.any(String),
        memeCoinType: expect.any(String),
        balanceLp: expect.any(String),
      }),
    );
  });
});
