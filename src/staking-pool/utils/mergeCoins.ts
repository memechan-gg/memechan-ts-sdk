import { CoinStruct } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

type MergeCoinArgs = {
  tx: TransactionBlock;
  coins: CoinStruct[];
};

/**
 * Merges the provided coins into a single coin.
 *
 * @param {MergeCoinArgs} params - The parameters for merging coins.
 * @return {Object} The merged coin and the transaction block.
 */
export function mergeCoins(params: MergeCoinArgs) {
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
