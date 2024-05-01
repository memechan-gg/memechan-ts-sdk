import { TransactionBlock } from "@mysten/sui.js/transactions";
import { BondingPoolSingleton, CoinManagerSingleton } from "../../src";
import { parseTransactionDataLpCoinCreation } from "../../src/bonding-pool/utils/parseTransactionDataLpCoinCreation";
import { keypair, provider, suiProviderUrl, user } from "../common";
import { sleep } from "../utils/sleep";

// yarn tsx examples/admin/init-secondary-market.ts
export const initSecondaryMarketExample = async ({ transaction }: { transaction?: TransactionBlock } = {}) => {
  const tx = transaction ?? new TransactionBlock();

  const bondingCurveInstance = BondingPoolSingleton.getInstance(suiProviderUrl);
  const { pools } = await bondingCurveInstance.getAllPools();
  const [pool] = pools;
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
  };
  console.debug("initSecondaryParams: ", initSecondaryParams);

  const initSecondaryMarketTx = BondingPoolSingleton.initSecondaryMarket(initSecondaryParams);
  console.debug("tx.serialize: ", JSON.stringify(JSON.parse(tx.serialize()), null, 2));

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
