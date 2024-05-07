import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { LiveCLMM } from "../../src";

describe("Live CLMM", () => {
  /* test("Ensuring that the live pool is instanciated properly starting from TX digest", async () => {
    const clmmPool = await LiveCLMM.fromGoLiveDefaultTx({
      txDigest: "9nC4RG4ma6mLf9GciXSn2fHi4SPuKrGsieGyqvAc6EY3",
      provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
    });
    const poolData = await clmmPool.getPool();
    console.log(poolData);
  });*/

  test("Get live pools from registry", async () => {
    const livePools = await LiveCLMM.fromRegistry({
      provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
    });
    console.log("live pools", livePools.length);
  });
});
