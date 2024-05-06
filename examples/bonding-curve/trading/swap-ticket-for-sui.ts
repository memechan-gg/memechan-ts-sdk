import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-ticket-for-sui.ts
export const swapTicketForSuiExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  // get random pool
  const pool =
    poolsByMemeCoinTypeMap[
      "0xbbd380a1ac2e03b7b56f429c1abd660a2db16ef019fc6366c1b43dc6b5450979::meme_04_05_2024_01::MEME_04_05_2024_01"
    ];

  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

  // const inputTicketAmount = "848476175.625";
  const inputTicketAmount = "1";

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
