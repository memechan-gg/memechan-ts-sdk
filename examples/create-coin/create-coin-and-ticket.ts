import { BondingPoolSingleton, CreateCoinTransactionParams } from "../../src";
import { keypair, provider } from "../common";

export const createCoinAndTicket = async (params: CreateCoinTransactionParams) => {
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
