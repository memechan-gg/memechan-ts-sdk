import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-sui-for-ticket.ts
export const swapSuiForTicketExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  // get random pool
  const pool =
    poolsByMemeCoinTypeMap[
      "0xd7436c4c051caf789cc80901a22a97bb59c44fbd0f7f55e2470ac3dec375e8b0::meme_06_05_2024_02::MEME_06_05_2024_02"
    ];
  const inputAmount = "1.1";
  //   const inputAmount = "30000";
  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

  const outputAmount = await bondingCurveInstance.getSwapOutputAmountForSuiInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputAmount,
    memeCoin: { coinType: pool.memeCoinType },
    slippagePercentage: 0,
  });

  console.debug("outputAmount: ", outputAmount);

  const swapTxData = await BondingPoolSingleton.swapSuiForTicket({
    bondingCurvePoolObjectId: pool.objectId,
    inputAmount,
    memeCoin: { coinType: pool.memeCoinType },
    minOutputTicketAmount: outputAmount,
    signerAddress: user,
    slippagePercentage: 0,
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
