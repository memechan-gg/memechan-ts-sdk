import { keypair, provider, suiProviderUrl, user } from "../../common";
import { BondingPoolSingleton } from "../../../src";

// yarn tsx examples/bonding-curve/trading/swap-ticket-for-sui.ts
export const swapTicketForSuiExample = async () => {
  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);

  // get all pools
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  const memecoinCointype =
    "0xd57bf62c5f214ca3f68ddf0abbb645f222e21c322156e2f32538707826a52388::meme_08_05_2024_02::MEME_08_05_2024_02";

  // get random pool
  const pool = poolsByMemeCoinTypeMap[memecoinCointype];

  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

  // const inputTicketAmount = "848476175.625";
  const inputTicketAmount = "257505502.5";

  console.debug("pool: ", pool);

  const { stakedLpObjectsByMemeCoinTypeMap } = await BondingPoolSingleton.getAllStakedLPObjectsByOwner({
    owner: user,
    provider,
  });
  const ticketsByMemecoin = stakedLpObjectsByMemeCoinTypeMap[memecoinCointype];
  console.debug("allStakedLpObjects: ", ticketsByMemecoin);

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
