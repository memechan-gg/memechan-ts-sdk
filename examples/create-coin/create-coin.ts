import { keypair, provider, user } from "../common";
import { CoinManagerSingleton } from "../../src/coin/CoinManager";
import { CreateCoinTransactionParams } from "../../src";

// yarn ts-node examples/create-coin/create-coin.ts
export const createCoin = async (params: CreateCoinTransactionParams) => {
  const createCoinTx = await CoinManagerSingleton.getCreateCoinTransaction(params);

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: createCoinTx,
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
