/* eslint-disable require-jsdoc */
import { BondingPoolSingleton, LiveCLMM, StakingPool } from "../../src";
import { getQueriedTransactions } from "../../src/utils/getQueriedTransactions";
import { keypair, provider, signAndExecuteTransaction } from "../common";
import { sleep } from "../utils/sleep";

// yarn tsx examples/staking-pool/collect-fees-intervally.ts > log.txt 2>&1
export async function collectFeesIntervally() {
  let isCollectingCurrently = false;
  const interval = 1000 * 60 * 15; // 15 mins

  await collectAllFees();

  setInterval(async () => {
    if (isCollectingCurrently) {
      return;
    }
    isCollectingCurrently = true;

    await collectAllFees();

    isCollectingCurrently = false;
  }, interval);
}

export async function collectAllFees() {
  const transactions = await getQueriedTransactions({
    provider,
    options: {
      filter: {
        MoveFunction: { package: BondingPoolSingleton.PACKAGE_OBJECT_ID, module: "go_live", function: "go_live" },
      },
    },
  });
  console.debug("transactions:", transactions);

  for (const txDigest of transactions) {
    const stakingPool = await StakingPool.fromGoLiveDefaultTx({
      txDigest,
      provider,
    });

    const interestPoolInstance = await LiveCLMM.fromGoLiveDefaultTx({
      txDigest,
      provider,
    });

    const interestPool = await interestPoolInstance.getPool();

    const { tx } = stakingPool.collectFees({
      clmmPool: interestPool.poolObjectId,
      stakingPool: stakingPool.data.address,
    });

    // const res = await provider.devInspectTransactionBlock({ transactionBlock: tx, sender: user });
    const res = await signAndExecuteTransaction(tx, keypair);
    console.debug("transaction status:", res.effects?.status);

    await sleep(1000);
  }
}

collectFeesIntervally();
