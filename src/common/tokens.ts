import BigNumber from "bignumber.js";
import { TransactionArgument, TransactionBlock } from "@mysten/sui.js/transactions";
import { intoToken, join, split } from "@avernikoz/memechan-ts-interface/dist/memechan/staked-lp/functions";
import { SUI_CLOCK_OBJECT_ID, SUI_TYPE_ARG } from "@mysten/sui.js/utils";
import { getAllOwnedObjects } from "../bonding-pool/utils/getAllOwnedObjects";
import { SuiClient } from "@mysten/sui.js/client";
import { z } from "zod";

export type Token = {
  objectId: string;
  balance: string;
  coinType: string;
};

export const tokenRpcResponseSchema = z.object({
  dataType: z.literal("moveObject"),
  type: z.string(),
  objectId: z.string(),
  fields: z.object({
    balance: z.object({
      fields: z.object({
        value: z.string(),
      }),
    }),
  }),
});

export const getMergedToken = ({
  remainingAmountBN,
  availableTokens,
  tokenPolicyObjectId,
  memeCoinType,
  transaction,
}: {
  remainingAmountBN: BigNumber;
  availableTokens: Token[];
  tokenPolicyObjectId: string;
  memeCoinType: string;
  transaction?: TransactionBlock;
}) => {
  const tx = transaction ?? new TransactionBlock();
  const firstTicket = availableTokens[0];
  let ticketObject: TransactionArgument = tx.object(firstTicket.objectId);

  const firstTicketAmountBN = new BigNumber(firstTicket.balance);

  // if first ticket object can fulfill all remaining amount at once without split
  if (firstTicketAmountBN.isEqualTo(remainingAmountBN)) {
    remainingAmountBN = remainingAmountBN.minus(firstTicketAmountBN);
  } else if (firstTicketAmountBN.isGreaterThan(remainingAmountBN)) {
    // if first ticket object can fulfill all remaining amount with split
    const splitAmountBigInt = BigInt(remainingAmountBN.toString());
    const splitTxResult = split(tx, firstTicket.coinType, {
      self: firstTicket.objectId,
      splitAmount: splitAmountBigInt,
    });
    const [ticketSplittedObject] = splitTxResult;
    ticketObject = ticketSplittedObject;
    remainingAmountBN = remainingAmountBN.minus(remainingAmountBN);
  } else if (firstTicketAmountBN.isLessThan(remainingAmountBN)) {
    // if first ticket object can't fulfull remaining amount, we just skip it, since we set it initially
    // in the ticketObject above
    remainingAmountBN = remainingAmountBN.minus(firstTicketAmountBN);

    availableTokens = availableTokens.slice(1);
  }

  for (const token of availableTokens) {
    // check if the first ticket fulfulled already the remaining amount
    if (remainingAmountBN.isEqualTo(0)) {
      // console.warn("Remaining amount is 0, skipping");
      break;
    }

    const ticketBalanceBN = new BigNumber(token.balance);

    if (ticketBalanceBN.isEqualTo(remainingAmountBN)) {
      // if current ticket is equal to remainingAmount
      join(tx, token.coinType, { self: ticketObject, c: token.objectId });

      break;
    } else if (ticketBalanceBN.isGreaterThan(remainingAmountBN)) {
      // if current ticket amount is bigger than the remainingAmount, we need to split, and then exit from the loop
      const splitAmountBigInt = BigInt(remainingAmountBN.toString());
      const splitTxResult = split(tx, token.coinType, {
        self: token.objectId,
        splitAmount: splitAmountBigInt,
      });
      const [ticketSplittedObject] = splitTxResult;
      join(tx, token.coinType, { self: ticketObject, c: ticketSplittedObject });

      break;
    } else if (ticketBalanceBN.isLessThan(remainingAmountBN)) {
      // if current ticket amount is less than the remainingAmount, we need to join with existing tickets
      // and continue iterating over cycle
      join(tx, token.coinType, { self: ticketObject, c: token.objectId });
    }

    remainingAmountBN = remainingAmountBN.minus(ticketBalanceBN);
  }

  // converting ticket into token object
  const ticketTokenObjectTxResult = intoToken(tx, memeCoinType, {
    clock: SUI_CLOCK_OBJECT_ID,
    policy: tokenPolicyObjectId,
    stakedLp: ticketObject,
  });
  const [ticketTokenObject] = ticketTokenObjectTxResult;

  return ticketTokenObject;
};

export const getAllTokens = async ({
  walletAddress,
  coinType,
  provider,
}: {
  walletAddress: string;
  coinType: string;
  provider: SuiClient;
}) => {
  const allTokens = await getAllOwnedObjects({
    provider,
    options: {
      owner: walletAddress,
      filter: { StructType: `${SUI_TYPE_ARG}::sui::Token<${coinType}>` },
      options: {
        showContent: true,
        showType: true,
      },
    },
  });
  const result: Token[] = [];
  for (const t of allTokens) {
    const tokenResponse = tokenRpcResponseSchema.parse(t.data);
    result.push({
      balance: tokenResponse.fields.balance.fields.value,
      coinType,
      objectId: tokenResponse.objectId,
    });
  }
  return result;
};
