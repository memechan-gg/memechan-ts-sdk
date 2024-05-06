import { keypair, provider, user } from "../common";
import { StakingPool } from "../../src";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";

// yarn tsx examples/staking-pool/unstake-from-pool.ts
export const unstakeFromPool = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "12aZ8vaZFS4eJULP7hbeEdzRfQuAaEUrPbt75F1oz2tY",
    provider,
  });

  // Input amount that user wants to unstake from the staking pool, ticket coin
  const { availableMemeAmountToUnstake } = await stakingPool.getAvailableAmountToUnstake({ owner: user });
  const tx = new TransactionBlock();
  const unstakeFromStakingPoolTx = await stakingPool.getUnstakeTransaction({
    transaction: tx,
    inputAmount: availableMemeAmountToUnstake,
    signerAddress: user,
  });

  console.debug("unstakeFromStakingPoolTx: ", unstakeFromStakingPoolTx);

  // const res = await provider.signAndExecuteTransactionBlock({
  //   transactionBlock: unstakeFromStakingPoolTx.tx,
  //   signer: keypair,
  //   options: {
  //     showBalanceChanges: true,
  //     showEffects: true,
  //     showEvents: true,
  //     showObjectChanges: true,
  //     showInput: true,
  //   },
  // });

  const res = await provider.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: user,
  });

  console.debug("res: ", res);
};

unstakeFromPool();
