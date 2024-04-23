/* eslint-disable max-len */
import { CreateCoinTransactionParams } from "../../src";
import { BondingPoolSingleton } from "../../src/bonding-pool/BondingPool";
import { parseTransactionDataCoinAndTicketCreation } from "../../src/bonding-pool/utils/parseTransactionDataCoinAndTicketCreation";
import { keypair, provider, user } from "../common";
import { sleep } from "../utils/sleep";

// yarn ts-node examples/bonding-curve/create-coins-and-create-bonding-curve.ts
export const createCoinsForBondingCurve = async (params: CreateCoinTransactionParams) => {
  const memeAndTicketCoinTx = await BondingPoolSingleton.createMemeAndTicketCoins(params);

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: memeAndTicketCoinTx,
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
  const createBondingCurvePoolTx = BondingPoolSingleton.createBondingCurvePool({ memeCoin, ticketCoin });
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
