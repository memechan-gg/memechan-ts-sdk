import { keypair, provider, user } from "../common";
import { StakingPool } from "../../src";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";

// yarn tsx examples/staking-pool/unstake-from-pool.ts
export const unstakeFromPool = async () => {
  const stakingPool = await StakingPool.fromGoLiveDefaultTx({
    txDigest: "9nC4RG4ma6mLf9GciXSn2fHi4SPuKrGsieGyqvAc6EY3",
    provider: new SuiClient({ url: getFullnodeUrl("mainnet") }),
  });

  // Input amount that user wants to unstake from the staking pool, ticket coin
  const inputAmount = "0.4151519";
  const tx = new TransactionBlock();
  const unstakeFromStakingPoolTx = await stakingPool.unstake(tx, {
    inputAmount,
    signerAddress: user,
  });

  console.debug("unstakeFromStakingPoolTx: ", unstakeFromStakingPoolTx);

  const unstakeFromStakingPoolTxResult = await provider.signAndExecuteTransactionBlock({
    transactionBlock: unstakeFromStakingPoolTx.tx,
    signer: keypair,
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showInput: true,
    },
  });

  console.debug("unstakeFromStakingPoolTxResult: ", unstakeFromStakingPoolTxResult);
};

unstakeFromPool();
