import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { PoolAPI, StakingPool } from "../../src";
import { FeeState } from "../../src/staking-pool/FeeState";
import { VestingConfig } from "../../src/staking-pool/VestingConfig";

const BE_URL = undefined; // "https://14r6b4r6kf.execute-api.us-east-1.amazonaws.com/prod";

describe("Staking Pool", () => {
  test("Ensuring that the staking pool is instanciated properly starting from TX digest", async () => {
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
      balanceMeme: expect.any(String),
    });
  });

  test("Ensure that the parsing from registry doesn't generate errors", async () => {
    await StakingPool.fromRegistry({ provider: new SuiClient({ url: getFullnodeUrl("mainnet") }) });
  });
});
