import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SUI_TYPE_ARG } from "@mysten/sui.js/utils";
import { keypair, provider } from "../common";

export const initSecondaryMarket = (
  tx: TransactionBlock,
  params: {
    adminCap: string;
    seedPool: string;
    memeMeta: string;
    memeCoinType: string;
    ticketType: string;
    ticketTreasuryCapId: string;
  },
) => {
  tx.moveCall({
    target: "0x8f9a0538e30a67e900fe0db14ed6845b72e1f89378f204c2f3ba5b25eadc7fd1::initialize::init_secondary_market",
    arguments: [
      tx.object(params.adminCap),
      tx.object(params.seedPool),
      tx.object("0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3"),
      tx.object(params.memeMeta),
      tx.object(params.ticketTreasuryCapId),
      tx.object("0x0000000000000000000000000000000000000000000000000000000000000006"),
    ],
    typeArguments: [SUI_TYPE_ARG, params.memeCoinType, params.ticketType],
  });
};

const tx = new TransactionBlock();

initSecondaryMarket(tx, {
  adminCap: "0x8f6e687d53b1d0390325da368bd0e7911f9e394a456095199b340596ee8f6ae9",
  seedPool: "0x33c714b13d3127e29c0105ecde585c2ebfc5eff15233042a113d71b2bb56949a",
  memeMeta: "0x9730aff44f125c17859cb655aca9c13c53dced2fd09b5e7b054c99751685e17e",
  ticketTreasuryCapId: "0x978f5899378f3bd677d312276844485b7c9c50ae7e8cb836d0d657d04c6fd51f",
  memeCoinType: "0x997285eeef9681204c0bfc14c66b52c5548cb2967c022b41e5fa8284d366edda::test_token_4am::TEST_TOKEN_4AM",
  ticketType:
    "0xfa9f8b5e000aba4f753dd3eeb30797e9b3e5f94f062aba6a63b1ba8e2bb5f6f1::ac_b_test_token_4am::AC_B_TEST_TOKEN_4AM",
});

const res = await provider.signAndExecuteTransactionBlock({
  transactionBlock: tx,
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
