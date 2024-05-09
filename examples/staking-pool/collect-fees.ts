import { LiveCLMM, StakingPool } from "../../src";
import { keypair, provider, signAndExecuteTransaction } from "../common";

// yarn tsx examples/staking-pool/collect-fees.ts
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

  const { tx } = stakingPool.collectFees({
    clmmPool: interestPool.poolObjectId,
    stakingPool: stakingPool.data.address,
  });

  const res = await signAndExecuteTransaction(tx, keypair);
  console.debug("res:", res);
};

collectFees();
