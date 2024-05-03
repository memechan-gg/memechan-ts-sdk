import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { StakingPool } from "../../src";
import { FeeState } from "../../src/staking-pool/FeeState";
import { VestingConfig } from "../../src/staking-pool/VestingConfig";

describe("Staking Pool", () => {
  test("Ensuring that the staking pool is instanciated properly starting from TX digest", async () => {
    const stakingPool = await StakingPool.fromGoLiveDefaultTx({
      txDigest: "9nC4RG4ma6mLf9GciXSn2fHi4SPuKrGsieGyqvAc6EY3",
      provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
    });
    expect(stakingPool.data).toEqual({
      feeState: expect.any(FeeState),
      vesting: expect.any(VestingConfig),
      address: "0x62719099de2a83f8cde7b639e29ae002050c7890958c2619f1846997315d8ca9",
      ammPool: "0xcd58f4164c0d50cdc07071ca0854007c8620357c87419a184ba49ef8f76d386c",
      poolAdmin: "0x6bf6a4da1075605ce0be26cde4afed3d0ef585b608a7b4cab54e69eedb0d44f8",
      totalSupply: "2000000000000000",
      lpCoinType: "0xc810f9f82a39355f30d29e94e2de27d884e5ec9791e3f75a9bbf682fa3943d67::lp_coin::LP_COIN",
      memeCoinType:
        "0xdb838a0becb92dcf9fd66127136f517f8f6d7a9f973b2344d1ebbd7d2cf2c0fa::meme_02_05_2024::MEME_02_05_2024",
      balanceLp: "29249332744628",
      balanceMeme: "220000000000000",
    });
  });
});
