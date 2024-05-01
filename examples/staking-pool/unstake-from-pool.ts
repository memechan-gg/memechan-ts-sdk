import { keypair, provider, suiProviderUrl, user } from "../common";
import { StakingPool } from "../../src";
import { TransactionBlock } from "@mysten/sui.js/transactions";

// yarn tsx examples/staking-pool/unstake-from-pool.ts
export const unstakeFromPool = async () => {
  const stakingPool = new StakingPool({
    memeCoinType: "0x5a63a58787c6ebc1faf9741a6ef9292020b2a02278a8d23b15c03938aadb8237::test_token_4am::TEST_TOKEN_4AM",
    lpCoinType: "",
    address: "0xa867022657c563d23e34b5d4557605f8347e4a214053e98268411e297efdd1e9",
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
