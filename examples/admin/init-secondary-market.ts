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
      "0xdb838a0becb92dcf9fd66127136f517f8f6d7a9f973b2344d1ebbd7d2cf2c0fa::meme_02_05_2024::MEME_02_05_2024"
    ];
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
  };
  console.debug("initSecondaryParams: ", initSecondaryParams);

  const initSecondaryMarketTx = BondingPoolSingleton.initSecondaryMarket(initSecondaryParams);
  console.debug("tx.serialize: ", JSON.stringify(JSON.parse(initSecondaryMarketTx.tx.serialize()), null, 2));

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
