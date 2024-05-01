import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-ticket-for-sui.ts
export const swapTicketForSuiExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  // get random pool
  const memeCoinType =
    "0x6b98a3246b0e269466f36e7f22dc3a5e856afade41c00a0be7046c762aaf8787::meme_01_05_2024::MEME_01_05_2024";
  const pool = poolsByMemeCoinTypeMap[memeCoinType];
  const inputTicketAmount = "9551313";

  console.debug("pool: ", pool);

  const outputAmount = await bondingCurveInstance.getSwapOutputAmountForTicketInput({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
    slippagePercentage: 10,
  });

  console.debug("outputAmount: ", outputAmount);

  const swapTxData = await bondingCurveInstance.swapTicketForSui({
    bondingCurvePoolObjectId: pool.objectId,
    inputTicketAmount,
    memeCoin: { coinType: pool.memeCoinType },
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
