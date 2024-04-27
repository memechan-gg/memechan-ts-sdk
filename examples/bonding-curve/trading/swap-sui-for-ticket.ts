import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-sui-for-ticket.ts
export const swapSuiForTicketExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  const memeCoin = {
    coinType: "0x5a63a58787c6ebc1faf9741a6ef9292020b2a02278a8d23b15c03938aadb8237::test_token_4am::TEST_TOKEN_4AM",
  };

  const ticketCoin = {
    coinType:
      "0x555c26e3908611654eb3044a4f312c69aa9921fbda5844db25d2d1e3118013e4::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
  };

  const poolId = "0xa867022657c563d23e34b5d4557605f8347e4a214053e98268411e297efdd1e9";

  const inputAmount = "0.4151519";
  //   const inputAmount = "30000";

  const outputAmount = await bondingCurveInstance.getSwapOutputAmountForSuiInput({
    bondingCurvePoolObjectId: poolId,
    inputAmount,
    memeCoin,
    ticketCoin,
    slippagePercentage: 0,
  });

  console.debug("outputAmount: ", outputAmount);

  const swapTxData = await BondingPoolSingleton.swapSuiForTicket({
    bondingCurvePoolObjectId: poolId,
    inputAmount,
    memeCoin,
    ticketCoin,
    minOutputTicketAmount: outputAmount,
    signerAddress: user,
  });

  console.debug("swapTxData.tx: ", swapTxData.tx);

  // const res = await provider.devInspectTransactionBlock({
  //   transactionBlock: swapTxData.tx,
  //   sender: user,
  // });

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: swapTxData.tx,
    signer: keypair,
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showInput: true,
    },
  });

  console.debug("res: ", res);
};

swapSuiForTicketExample();
