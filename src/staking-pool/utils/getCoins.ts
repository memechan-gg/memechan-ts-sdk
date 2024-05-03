import { CoinStruct, SuiClient } from "@mysten/sui.js/client";

type GetCoinArgs = {
  coin: string;
  address: string;
  provider: SuiClient;
};

/**
 * Gets the coins of the provided type owned by the provided address.
 *
 * @param {GetCoinArgs} params - The parameters for getting coins.
 * @return {Array} The coins of the provided type owned by the provided address.
 */
export async function getCoins(params: GetCoinArgs) {
  const { coin, address, provider } = params;
  let hasNextPage = true;
  let cursor: string | null | undefined = null;
  let coinStructs: CoinStruct[] = [];

  while (hasNextPage) {
    const response = await provider.getCoins({
      owner: address,
      coinType: coin,
      cursor,
    });

    const coins = response.data;
    coinStructs = [...coinStructs, ...coins];
    hasNextPage = response.hasNextPage;

    if (hasNextPage) {
      const { nextCursor } = response;
      cursor = nextCursor;
    }
  }

  return coinStructs;
}
