import { keypair, provider, user } from "../common";
import { StakingPool } from "../../src";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";

// yarn tsx examples/staking-pool/withdraw-from-pool.ts
export const withdrawFromPool = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "9nC4RG4ma6mLf9GciXSn2fHi4SPuKrGsieGyqvAc6EY3",
    provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
  });

  const tx = new TransactionBlock();
  stakingPool.withdrawFees(tx, user);

  console.debug("withdrawFromStakingPoolTx: ", JSON.stringify(JSON.parse(tx.serialize()), null, 2));

  const withdrawFromStakingPoolTxResult = await provider.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: keypair,
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showInput: true,
    },
  });

  console.debug("withdrawFromStakingPoolTxResult: ", withdrawFromStakingPoolTxResult);
};

withdrawFromPool();
