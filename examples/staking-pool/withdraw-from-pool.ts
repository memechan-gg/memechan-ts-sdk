import { keypair, provider, user } from "../common";
import { StakingPoolSingleton } from "../../src";

// yarn tsx examples/staking-pool/withdraw-from-pool.ts
export const withdrawFromPool = async () => {
  const memeCoin = {
    coinType: "0x5a63a58787c6ebc1faf9741a6ef9292020b2a02278a8d23b15c03938aadb8237::test_token_4am::TEST_TOKEN_4AM",
  };

  const ticketCoin = {
    coinType:
      "0x555c26e3908611654eb3044a4f312c69aa9921fbda5844db25d2d1e3118013e4::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
  };

  const stakingPoolObjectId = "0xa867022657c563d23e34b5d4557605f8347e4a214053e98268411e297efdd1e9";

  let withdrawFromStakingPoolTx = await StakingPoolSingleton.withdrawFromStakingPool({
    memeCoin,
    signerAddress: user,
    stakingPoolObjectId,
    ticketCoin,
  });

  console.debug("withdrawFromStakingPoolTx: ", withdrawFromStakingPoolTx);

  const withdrawFromStakingPoolTxResult = await provider.signAndExecuteTransactionBlock({
    transactionBlock: withdrawFromStakingPoolTx.tx,
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
