import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-ticket-for-sui.ts
export const swapTicketForSuiExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  // get random pool
  const pool = pools.find((p) => p.objectId === "0x016240f772a157ba5c1156f1cf282660da1c3e1c22489e770a2292a7a4ab8551");
  if (!pool) throw new Error("Pool doesn't exists");
  const inputTicketAmount = "46201166666";

  console.debug("pool: ", pool);

  const outputAmount = await bondingCurveInstance.getSwapOutputAmountForTicketInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
    slippagePercentage: 0,
  });

  console.debug("outputAmount: ", outputAmount);

  const swapTxData = await bondingCurveInstance.swapTicketForSui({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
    minOutputSuiAmount: outputAmount,
    signerAddress: user,
    slippagePercentage: 0,
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
