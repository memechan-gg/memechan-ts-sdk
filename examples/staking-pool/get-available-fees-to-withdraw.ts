import { StakingPool } from "../../src";
import { provider, user } from "../common";

// yarn tsx examples/staking-pool/get-available-fees-to-withdraw.ts
export const getAvailableFeesToWithdraw = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "4v8DoaJze4s2dpNKS9cLyKQafTS4tQNpKVMwg4uneRbf",
    provider,
  });

  const fees = await stakingPool.getAvailableFeesToWithdraw({ owner: user });
  console.debug("fees:", fees);
};

getAvailableFeesToWithdraw();
