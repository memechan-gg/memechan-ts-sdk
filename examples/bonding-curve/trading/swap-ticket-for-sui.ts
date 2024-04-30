import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-ticket-for-sui.ts
export const swapTicketForSuiExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap, poolsByTicketCoinTypeMap } = await bondingCurveInstance.getAllPools();

  // get random pool
  const ticketCoinType =
    "0xbab599a35e42232bb8af53d7c2dc747d186fe5720b7c06306c22055d44da3dce::ticket_meme_26_2024::TICKET_MEME_26_2024";
  const pool = poolsByTicketCoinTypeMap[ticketCoinType];
  const inputTicketAmount = "10672466";

  console.debug("pool: ", pool);

  const outputAmount = await bondingCurveInstance.getSwapOutputAmountForTicketInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
    ticketCoin: { coinType: pool.ticketCoinType },
    slippagePercentage: 10,
  });

  console.debug("outputAmount: ", outputAmount);

  const swapTxData = await bondingCurveInstance.swapTicketForSui({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
    ticketCoin: { coinType: pool.ticketCoinType },
    minOutputSuiAmount: outputAmount,
    signerAddress: user,
    slippagePercentage: 10,
  });

  // console.debug("swapTxData.tx: ", swapTxData.tx);
  // console.debug("tx.serialize: ", JSON.stringify(JSON.parse(swapTxData.tx.serialize()), null, 2));

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

swapTicketForSuiExample();
