import { BondingPoolSingleton } from "../../src";
import { suiProviderUrl } from "../common";

// yarn tsx examples/bonding-curve/is-memecoin-ready-to-live-phase.ts
export const isMemecoinReadyToLivePhase = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const memeCoin = {
    coinType: "0x5a63a58787c6ebc1faf9741a6ef9292020b2a02278a8d23b15c03938aadb8237::test_token_4am::TEST_TOKEN_4AM",
  };

  const ticketCoin = {
    coinType:
      "0x555c26e3908611654eb3044a4f312c69aa9921fbda5844db25d2d1e3118013e4::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
  };

  const poolId = "0xa867022657c563d23e34b5d4557605f8347e4a214053e98268411e297efdd1e9";

  const res = await bondingCurveInstance.isMemeCoinReadyToLivePhase({ memeCoin, ticketCoin, poolId });
  console.debug("res: ", res);
};

isMemecoinReadyToLivePhase();
