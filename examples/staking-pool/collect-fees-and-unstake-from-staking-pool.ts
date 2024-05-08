import { LiveCLMM, StakingPool } from "../../src";
import { keypair, provider, signAndExecuteTransaction, user } from "../common";

// yarn tsx examples/staking-pool/collect-fees-and-unstake-from-staking-pool.ts
export const collectFees = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "Bp4X158y53Y1aJ4iy6vDJFBpfFq38tZskN3wsFGpNJJg",
    provider,
  });

  const interestPoolInstance = await LiveCLMM.fromGoLiveDefaultTx({
    txDigest: "Bp4X158y53Y1aJ4iy6vDJFBpfFq38tZskN3wsFGpNJJg",
    provider,
  });

  const interestPool = await interestPoolInstance.getPool();
  const { availableMemeAmountToUnstake } = await stakingPool.getAvailableAmountToUnstake({ owner: user });

  console.debug("availableMemeAmountToUnstake: ", availableMemeAmountToUnstake);

  const { tx } = await stakingPool.getCollectFeesAndUnstakeTransaction({
    clmmPool: interestPool.poolObjectId,
    stakingPool: stakingPool.data.address,
    inputAmount: availableMemeAmountToUnstake,
    signerAddress: user,
  });

  const res = await signAndExecuteTransaction(tx, keypair);
  console.debug("res:", res);
};

collectFees();
