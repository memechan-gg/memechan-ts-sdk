import { LiveCLMM, StakingPool } from "../../src";
import { keypair, provider, signAndExecuteTransaction, user } from "../common";

// yarn tsx examples/staking-pool/get-available-amount-to-unstake.ts
export const getAvailableAmountToUnstakeExample = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "Bp4X158y53Y1aJ4iy6vDJFBpfFq38tZskN3wsFGpNJJg",
    provider,
  });

  const { availableMemeAmountToUnstake } = await stakingPool.getAvailableAmountToUnstake({ owner: user });

  console.debug("res:", availableMemeAmountToUnstake);
};

getAvailableAmountToUnstakeExample();
