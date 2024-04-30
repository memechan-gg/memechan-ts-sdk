import { CoinStruct } from "@mysten/sui.js/client";
import { TransactionBlock, TransactionObjectArgument } from "@mysten/sui.js/transactions";

type MergeCoinArgs = {
  tx: TransactionBlock;
  coins: CoinStruct[];
};

/**
 * Merges provided coins into a single transaction block.
 * @param {MergeCoinArgs} params - The parameters for merging coins.
 * @param {TransactionBlock} params.tx - The transaction block to merge coins into.
 * @param {CoinStruct[]} params.coins - The coins to merge.
 * @return {{ tx: TransactionBlock, mergedCoin: TransactionObjectArgument }}
 * Returns the merged transaction block and the merged coin.
 * @throws {Error} Throws an error if no coins are provided to merge.
 */
export function mergeCoins(params: MergeCoinArgs): { tx: TransactionBlock; mergeCoin: TransactionObjectArgument } {
  const { tx, coins } = params;
  if (coins.length === 0) throw new Error("No coins provided to merge");

  const [firstCoin, ...otherCoins] = coins;
  const firstCoinInput = tx.object(firstCoin.coinObjectId);

  if (otherCoins.length > 0) {
    tx.mergeCoins(
      firstCoinInput,
      otherCoins.map((coin) => coin.coinObjectId),
    );
  }

  return {
    tx,
    mergedCoin: firstCoinInput,
  };
}
