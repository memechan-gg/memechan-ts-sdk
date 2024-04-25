import { keypair, provider, user } from "../common";
import { BondingPoolSingleton, CreateCoinTransactionParams } from "../../src";

// yarn ts-node examples/create-coin/create-coin.ts
export const createCoin = async (params: CreateCoinTransactionParams) => {
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

  console.debug("res: ", res);
  return res;
};

createCoin({
  decimals: "10",
  description: "testtoken3am description",
  fixedSupply: false,
  mintAmount: "900000000",
  name: "testtoken3am",
  signerAddress: user,
  symbol: "TEST_TOKEN_3AM",
  url: "",
});
