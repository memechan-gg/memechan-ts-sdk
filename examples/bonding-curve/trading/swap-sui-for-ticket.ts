import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-sui-for-ticket.ts
export const swapSuiForTicketExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools } = await bondingCurveInstance.getAllPools();

  // get random pool
  const pool = pools.find((p) => p.objectId === "0x4b35392bf2f9fdcf44f4a54fcabf7447795a0eb86315806fb7388840cbe8703c");
  const inputAmount = "1";
  //   const inputAmount = "30000";
  if (!pool) throw new Error("Pool doesn't exists");
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
