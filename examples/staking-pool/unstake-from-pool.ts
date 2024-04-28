import { keypair, provider, user } from "../common";
import { StakingPoolSingleton } from "../../src";

// yarn tsx examples/staking-pool/unstake-from-pool.ts
export const unstakeFromPool = async () => {
  const memeCoin = {
    coinType: "0x5a63a58787c6ebc1faf9741a6ef9292020b2a02278a8d23b15c03938aadb8237::test_token_4am::TEST_TOKEN_4AM",
  };

  const ticketCoin = {
    coinType:
      "0x555c26e3908611654eb3044a4f312c69aa9921fbda5844db25d2d1e3118013e4::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
  };

  const stakingPoolObjectId = "0xa867022657c563d23e34b5d4557605f8347e4a214053e98268411e297efdd1e9";

  // Input amount that user wants to unstake from the staking pool, ticket coin
  const inputAmount = "0.4151519";

  let unstakeFromStakingPoolTx = await StakingPoolSingleton.unstakeFromStakingPool({
    inputAmount,
    memeCoin,
    signerAddress: user,
    stakingPoolObjectId,
    ticketCoin,
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
