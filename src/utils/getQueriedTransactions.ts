import { QueryTransactionBlocksParams, SuiClient, SuiTransactionBlockResponse } from "@mysten/sui.js/client";

/* eslint-disable require-jsdoc */
export async function getQueriedTransactions({
  provider,
  options,
}: {
  provider: SuiClient;
  options: QueryTransactionBlocksParams;
}): Promise<string[]> {
  const allTransactions: string[] = [];
  let nextCursor: string | undefined | null = null;
  let transactions = await provider.queryTransactionBlocks(options);

  // Fetching and combining part
  while (transactions.hasNextPage) {
    const userTransactions: SuiTransactionBlockResponse[] = transactions.data;
    allTransactions.push(...userTransactions.map((transaction) => transaction.digest));

    nextCursor = transactions.nextCursor;
    transactions = await provider.queryTransactionBlocks({
      ...options,
      cursor: nextCursor,
    });
  }

  const userTransactions: SuiTransactionBlockResponse[] = transactions.data;
  allTransactions.push(...userTransactions.map((transaction) => transaction.digest));

  return allTransactions;
}
