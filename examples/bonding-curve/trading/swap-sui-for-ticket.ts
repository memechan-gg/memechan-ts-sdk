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
      "0xb09db619ab3cd89355c259660ef4c686b416cd6319332ef41be4dcfd5f4bfe4d::meme_07_05_2024_01::MEME_07_05_2024_01"
    ];
  const inputAmount = "0.05";
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
