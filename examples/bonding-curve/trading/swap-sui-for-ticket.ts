import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-sui-for-ticket.ts
export const swapSuiForTicketExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  const memecoinCointype =
    "0x232bcf980b826ab7bba1629c807b756e7fc507d0e84f009bfdd31caffa175365::meme_08_05_2024_06::MEME_08_05_2024_06";

  // get random pool
  const pool = poolsByMemeCoinTypeMap[memecoinCointype];
  const inputAmount = "1.2";
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
