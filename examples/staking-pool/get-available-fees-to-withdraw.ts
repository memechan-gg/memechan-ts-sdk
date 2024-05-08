import { StakingPool } from "../../src";
import { provider, user } from "../common";

// yarn tsx examples/staking-pool/get-available-fees-to-withdraw.ts
export const getAvailableFeesToWithdraw = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "12aZ8vaZFS4eJULP7hbeEdzRfQuAaEUrPbt75F1oz2tY",
    provider,
  });

  const fees = await stakingPool.getAvailableFeesToWithdraw({ owner: user });
  console.debug("fees:", fees);
};

getAvailableFeesToWithdraw();
