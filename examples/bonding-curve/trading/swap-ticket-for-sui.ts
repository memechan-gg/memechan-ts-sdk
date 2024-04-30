import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-ticket-for-sui.ts
export const swapTicketForSuiExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap, poolsByTicketCoinTypeMap } = await bondingCurveInstance.getAllPools();

  // get random pool
  const pool = pools[1];
  const inputTicketAmount = "15246385";

  console.debug("pool: ", pool);

  const outputAmount = await bondingCurveInstance.getSwapOutputAmountForTicketInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
    ticketCoin: { coinType: pool.ticketCoinType },
    slippagePercentage: 0,
  });

  console.debug("outputAmount: ", outputAmount);

  const swapTxData = await bondingCurveInstance.swapTicketForSui({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
    ticketCoin: { coinType: pool.ticketCoinType },
    minOutputSuiAmount: outputAmount,
    signerAddress: user,
  });

  console.debug("swapTxData.tx: ", swapTxData.tx);
  console.debug("tx.serialize: ", JSON.stringify(JSON.parse(swapTxData.tx.serialize()), null, 2));

  const res = await provider.devInspectTransactionBlock({
    transactionBlock: swapTxData.tx,
    sender: user,
  });

  //   const res = await provider.signAndExecuteTransactionBlock({
  //     transactionBlock: swapTxData.tx,
  //     signer: keypair,
  //     options: {
  //       showBalanceChanges: true,
  //       showEffects: true,
  //       showEvents: true,
  //       showObjectChanges: true,
  //       showInput: true,
  //     },
  //   });

  console.debug("res: ", res);
};

swapTicketForSuiExample();
