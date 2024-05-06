import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { LiveCLMM } from "../../src";

describe("Live CLMM", () => {
  test("Ensuring that the live pool is instanciated properly starting from TX digest", async () => {
    const clmmPool = await LiveCLMM.fromGoLiveDefaultTx({
      txDigest: "3Rd7GgszEpoEHbEtmQwSZmPDEvBKuYu4Pe5xrweRhFbo",
      provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
    });
    const poolData = await clmmPool.getPool();
    console.log(poolData);
  });
});
