import { TransactionBlock } from "@mysten/sui.js/transactions";
import { BondingPoolSingleton, CoinManagerSingleton } from "../../src";
import { parseTransactionDataLpCoinCreation } from "../../src/bonding-pool/utils/parseTransactionDataLpCoinCreation";
import { keypair, provider, suiProviderUrl, user } from "../common";
import { sleep } from "../utils/sleep";

// yarn tsx examples/admin/init-secondary-market.ts
export const initSecondaryMarketExample = async ({ transaction }: { transaction?: TransactionBlock } = {}) => {
  const tx = transaction ?? new TransactionBlock();

  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);
  // get all pools
  const { pools, poolsByMemeCoinTypeMap } = await bondingCurveInstance.getAllPools();

  // get random pool
  const pool =
    poolsByMemeCoinTypeMap[
      "0x3ae377c0ba6ea223582b693aa9fe283c24ba1feedba7dd308741d223888c53d5::meme_04_05_2024::MEME_04_05_2024"
    ];

  if (!pool) {
    throw new Error("Pool doesn't exists");
  }

  const initSecondaryMarketData = await bondingCurveInstance.getInitSecondaryMarketData({ poolId: pool.objectId });

  const lpCoinParams = BondingPoolSingleton.getLpCoinCreateParams({ signer: user });
  console.debug("lpCoinParams: ", lpCoinParams);
  const lpCoinTx = await CoinManagerSingleton.getCreateCoinTransaction(lpCoinParams);

  const coinCreationRes = await provider.signAndExecuteTransactionBlock({
    transactionBlock: lpCoinTx,
    signer: keypair,
    requestType: "WaitForLocalExecution",
    options: {
      showBalanceChanges: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showInput: true,
    },
  });

  console.debug("coinCreationRes: ", coinCreationRes);

  const lpCoinData = parseTransactionDataLpCoinCreation(coinCreationRes.objectChanges);

  await sleep(10000);

  const initSecondaryParams = {
    ...initSecondaryMarketData,
    lpCoinTreasureCapId: lpCoinData.lpCoin.treasureCapId,
    lpCoinType: lpCoinData.lpCoin.coinType,
    lpMeta: lpCoinData.lpCoin.metadataObjectId,

    // Custom params:
  };
  console.debug("initSecondaryParams: ", initSecondaryParams);

  // 5 minutes
  const CLIFF_DELTA = BigInt(5 * 60 * 1000);
  // 1 hour
  const END_VESING_DELTA = BigInt(60 * 60 * 1000);

  const initSecondaryMarketTx = BondingPoolSingleton.initSecondaryMarketWithCustomParams({
    ...initSecondaryParams,
    cliffDelta: CLIFF_DELTA,
    endVestingDelta: END_VESING_DELTA,
  });
  console.debug("tx.serialize: ", JSON.stringify(JSON.parse(initSecondaryMarketTx.tx.serialize()), null, 2));

  // eslint-disable-next-line max-len
  // const res = await provider.devInspectTransactionBlock({ sender: user, transactionBlock: initSecondaryMarketTx.tx });

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: initSecondaryMarketTx.tx,
    signer: keypair,
    requestType: "WaitForLocalExecution",
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

initSecondaryMarketExample();
