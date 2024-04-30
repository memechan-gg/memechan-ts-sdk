/* eslint-disable max-len */
import { CreateCoinTransactionParams } from "../../../src";
import { BondingPoolSingleton } from "../../../src/bonding-pool/BondingPool";
import { getTicketDataFromCoinParams } from "../../../src/bonding-pool/utils/getTicketDataFromCoinParams";
import { parseTransactionDataCoinAndTicketCreation } from "../../../src/bonding-pool/utils/parseTransactionDataCoinAndTicketCreation";
import { CoinManagerSingleton } from "../../../src/coin/CoinManager";
import { LONG_SUI_COIN_TYPE } from "../../../src/common/sui";
import { keypair, provider, user } from "../../common";
import { sleep } from "../../utils/sleep";

// yarn tsx examples/bonding-curve/create/create-meme-and-ticket-coins-tx.ts
export const createMemeAndTicketCoinsTxExample = async (params: CreateCoinTransactionParams) => {
  // Create Coin
  const coinTx = await CoinManagerSingleton.getCreateCoinTransaction(params);
  // Create Ticket for Coin
  const ticketFromParams = getTicketDataFromCoinParams(params);
  const ticketCoinTx = await CoinManagerSingleton.getCreateCoinTransaction({
    ...ticketFromParams,
    transaction: coinTx,
  });

  const res = await provider.devInspectTransactionBlock({
    transactionBlock: ticketCoinTx,
    sender: user,
  });

  //   const res = await provider.signAndExecuteTransactionBlock({
  //     transactionBlock: ticketCoinTx,
  //     signer: keypair,
  //     requestType: "WaitForLocalExecution",
  //     options: {
  //       showBalanceChanges: true,
  //       showEffects: true,
  //       showEvents: true,
  //       showObjectChanges: true,
  //       showInput: true,
  //     },
  //   });

  console.debug("res: ", res);
};

createMemeAndTicketCoinsTxExample({
  decimals: "6",
  description: "super awesome description",
  fixedSupply: false,
  mintAmount: "0",
  name: "superawesome",
  signerAddress: user,
  symbol: "SUPER_AWESOME",
  url: "",
});
