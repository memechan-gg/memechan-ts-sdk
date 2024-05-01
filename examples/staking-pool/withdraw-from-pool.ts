import { keypair, provider, user } from "../common";
import { StakingPool } from "../../src";
import { TransactionBlock } from "@mysten/sui.js/transactions";

// yarn tsx examples/staking-pool/withdraw-from-pool.ts
export const withdrawFromPool = async () => {
  const stakingPool = new StakingPool({
    memeCoinType: "0x5a63a58787c6ebc1faf9741a6ef9292020b2a02278a8d23b15c03938aadb8237::test_token_4am::TEST_TOKEN_4AM",
    lpCoinType: "",
    address: "0xa867022657c563d23e34b5d4557605f8347e4a214053e98268411e297efdd1e9",
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
