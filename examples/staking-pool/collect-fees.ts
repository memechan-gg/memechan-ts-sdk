import { TransactionBlock } from "@mysten/sui.js/transactions";
import { LiveCLMM, StakingPool } from "../../src";
import { keypair, provider, signAndExecuteTransaction } from "../common";

// yarn tsx examples/staking-pool/collect-fees.ts
export const collectFees = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "12aZ8vaZFS4eJULP7hbeEdzRfQuAaEUrPbt75F1oz2tY",
    provider,
  });

  const interestPoolInstance = await LiveCLMM.fromGoLiveDefaultTx({
    txDigest: "12aZ8vaZFS4eJULP7hbeEdzRfQuAaEUrPbt75F1oz2tY",
    provider,
  });

  const interestPool = await interestPoolInstance.getPool();

  const tx = new TransactionBlock();

  stakingPool.collectFees(tx, { pool: interestPool.poolObjectId, stakingPool: stakingPool.data.address });

  const res = await signAndExecuteTransaction(tx, keypair);
  console.debug("res:", res);
};

collectFees();
