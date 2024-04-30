/* eslint-disable max-len */
import { CreateCoinTransactionParams } from "../../../src";
import { BondingPoolSingleton } from "../../../src/bonding-pool/BondingPool";
import { getTicketDataFromCoinParams } from "../../../src/bonding-pool/utils/getTicketDataFromCoinParams";
import { parseTransactionDataCoinAndTicketCreation } from "../../../src/bonding-pool/utils/parseTransactionDataCoinAndTicketCreation";
import { CoinManagerSingleton } from "../../../src/coin/CoinManager";
import { LONG_SUI_COIN_TYPE } from "../../../src/common/sui";
import { keypair, provider, user } from "../../common";
import { sleep } from "../../utils/sleep";

// yarn tsx examples/bonding-curve/create/create-coins-and-create-bonding-curve-granural-version.ts
export const createCoinsForBondingCurve = async (params: CreateCoinTransactionParams) => {
  // Create Coin
  const coinTx = await CoinManagerSingleton.getCreateCoinTransaction(params);
  // Create Ticket for Coin
  const ticketFromParams = getTicketDataFromCoinParams(params);
  const ticketCoinTx = await CoinManagerSingleton.getCreateCoinTransaction({
    ...ticketFromParams,
    transaction: coinTx,
  });

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: ticketCoinTx,
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

  const { memeCoin, ticketCoin } = parseTransactionDataCoinAndTicketCreation(res.objectChanges);

  const createBondingCurvePoolTx = BondingPoolSingleton.createBondingCurvePoolWithDefaultParams(
    {
      registry: BondingPoolSingleton.REGISTRY_OBJECT_ID,
      memeCoinCap: memeCoin.treasureCapId,
      memeCoinMetadata: memeCoin.metadataObjectId,
      ticketCoinCap: ticketCoin.treasureCapId,
      ticketCoinMetadata: ticketCoin.metadataObjectId,
    },
    [ticketCoin.coinType, LONG_SUI_COIN_TYPE, memeCoin.coinType],
  );

  await sleep(7000);

  const res2 = await provider.signAndExecuteTransactionBlock({
    transactionBlock: createBondingCurvePoolTx.tx,
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

  console.debug("res2: ", res2);
};

createCoinsForBondingCurve({
  decimals: "6",
  description: "testtoken4am description",
  fixedSupply: false,
  mintAmount: "0",
  name: "testtoken4am",
  signerAddress: user,
  symbol: "TEST_TOKEN_4am",
  url: "",
});
