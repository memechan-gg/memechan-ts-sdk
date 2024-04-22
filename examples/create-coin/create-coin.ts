import { keypair, provider, user } from "../common";
import { CoinManagerSingleton } from "../../src/coin/CoinManager";
import { CreateCoinTransactionParams } from "../../src";

// yarn ts-node examples/create-coin/create-coin.ts
export const createCoin = async (params: CreateCoinTransactionParams) => {
  const createCoinTx = await CoinManagerSingleton.getCreateCoinTransaction(params);

  const res = await provider.signAndExecuteTransactionBlock({
    transactionBlock: createCoinTx,
    signer: keypair,
    requestType: "WaitForEffectsCert",
  });

  console.debug("res: ", res);
};

createCoin({
  decimals: "10",
  description: "test-token-321",
  fixedSupply: true,
  mintAmount: "9000000",
  name: "testtoken321",
  signerAddress: user,
  symbol: "TEST_TOKEN_THR",
  url: "",
});
